const AuditLog = require('../models/AuditLog');

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
    const logs  = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

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