const AuditLog    = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const Stock       = require('../models/Stock');

const getLogs = async (req, res) => {
  try {
    const { entity, action, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (req.user.role !== 'Manager') {
      filter.userId = req.user._id || req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }

    if (entity) filter.entity = entity;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(filter);
    let logs    = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Enrich Order logs with live documentNumber/status from the Transaction collection.
    // Works for all entry ages: entityId (UPDATE entries), or _id embedded in changes.after
    // (old CREATE entries where entityId was not stored).
    const orderLogs = logs.filter(l => l.entity === 'Order');
    if (orderLogs.length > 0) {
      const logIdMap = {}; // auditLog _id → transaction _id string

      // Pass 1: collect transaction IDs from stored fields (works for UPDATE + new CREATE entries)
      orderLogs.forEach(l => {
        const txId =
          l.entityId              ||
          l.changes?.after?._id  ||
          l.changes?.after?.data?._id ||
          l.changes?.before?._id;
        if (txId) logIdMap[l._id.toString()] = txId.toString();
      });

      const txMap = {};

      const knownIds = [...new Set(Object.values(logIdMap))];
      if (knownIds.length > 0) {
        const txs = await Transaction.find({ _id: { $in: knownIds } })
          .select('documentNumber status type')
          .lean();
        txs.forEach(t => { txMap[t._id.toString()] = t; });
      }

      // Pass 2: orphaned CREATE entries (old records with no entityId / no changes stored).
      // Match by createdBy === userId within ±5 s of the audit entry timestamp.
      const orphans = orderLogs.filter(
        l => l.action === 'CREATE' && !logIdMap[l._id.toString()]
      );
      if (orphans.length > 0) {
        const matched = await Promise.all(
          orphans.map(l => {
            const t0 = new Date(l.createdAt).getTime();
            return Transaction.findOne({
              createdBy: l.userId,
              createdAt: { $gte: new Date(t0 - 5000), $lte: new Date(t0 + 5000) },
            }).select('documentNumber status type _id').lean();
          })
        );
        orphans.forEach((l, i) => {
          const tx = matched[i];
          if (tx) {
            txMap[tx._id.toString()] = tx;
            logIdMap[l._id.toString()] = tx._id.toString();
          }
        });
      }

      logs = logs.map(l => {
        if (l.entity !== 'Order') return l;
        const txId = logIdMap[l._id.toString()];
        const tx   = txId && txMap[txId];
        if (tx) l._txData = { documentNumber: tx.documentNumber, status: tx.status, type: tx.type };
        return l;
      });
    }

    // Enrich Stock CREATE orphans (old entries with changes: null).
    // For DELETE the stock is gone, so we only recover name — quantity must come from changes.before.
    // For new entries (after backend restart) changes.after/before are stored correctly.
    const stockOrphans = logs.filter(
      l => l.entity === 'Stock' && l.action === 'CREATE' && !l.changes
    );
    if (stockOrphans.length > 0) {
      const matched = await Promise.all(
        stockOrphans.map(l => {
          const t0 = new Date(l.createdAt).getTime();
          return Stock.findOne({
            createdBy: l.userId,
            createdAt: { $gte: new Date(t0 - 5000), $lte: new Date(t0 + 5000) },
          }).select('name unit _id').lean();
        })
      );
      const stockNameMap = {};
      stockOrphans.forEach((l, i) => {
        if (matched[i]) stockNameMap[l._id.toString()] = matched[i];
      });

      logs = logs.map(l => {
        if (l.entity === 'Stock' && l.action === 'CREATE' && stockNameMap[l._id.toString()]) {
          const s = stockNameMap[l._id.toString()];
          // Only enrich name/unit — quantity is not reliable from live DB for old entries
          l._stockFallback = { name: s.name, unit: s.unit };
        }
        return l;
      });
    }

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Eroare la preluarea logurilor', error: err.message });
  }
};

const getActiveUsers = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Acces interzis' });
    }
    const users = await AuditLog.aggregate([
      { $group: { _id: '$userId', userName: { $first: '$userName' } } },
      { $project: { _id: 1, userName: 1 } }
    ]);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLogs, getActiveUsers };