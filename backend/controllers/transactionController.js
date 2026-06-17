const Transaction = require('../models/Transaction');
const Stock = require('../models/Stock');

// POST /api/transactions — Angajat SAU Manager pot crea
// La creare: status = "În așteptare", NIMIC nu se modifică în sold sau stoc
exports.createTransaction = async (req, res) => {
  try {
    const {
      type, documentType, supplier, category,
      netAmount, tva, totalAmount,
      dueDate, paymentMethod, notes,
      stockItem, stockQuantityDelta, documentNumber, bankAccount, issueDate, paymentStatus
    } = req.body;

    // Validare: dacă e Stoc produse, trebuie să aibă un item și cantitate
    if (category === 'Stoc produse') {
      if (!stockItem) {
        return res.status(400).json({
          success: false,
          message: 'Selectează produsul din stoc pentru această categorie.',
        });
      }
      if (!stockQuantityDelta || parseInt(stockQuantityDelta) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cantitatea trebuie să fie mai mare decât 0.',
        });
      }
      // Verifică că produsul există
      const stockExists = await Stock.findById(stockItem);
      if (!stockExists) {
        return res.status(404).json({
          success: false,
          message: 'Produsul selectat nu există în nomenclator.',
        });
      }
    }

    const transaction = await Transaction.create({
      type,
      documentType,
      supplier,
      category,
      netAmount: parseFloat(netAmount),
      tva: parseFloat(tva) || 0,
      totalAmount: parseFloat(totalAmount),
      dueDate: dueDate || undefined,
      paymentMethod,
      notes,
      stockItem: category === 'Stoc produse' ? stockItem : null,
      stockQuantityDelta: category === 'Stoc produse' ? parseInt(stockQuantityDelta) : 0,
      createdBy: req.user._id,
      status: 'În așteptare',
      documentNumber: documentNumber || '',
      bankAccount: bankAccount || '',
      issueDate: issueDate || undefined,
      paymentStatus: paymentStatus || 'Neplătit'
      // IMPORTANT: la creare nu se modifică nimic în sold sau stoc
    });

    await transaction.populate('createdBy', 'firstName lastName email role');
    if (transaction.stockItem) {
      await transaction.populate('stockItem', 'name quantity unit');
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/transactions — Angajat vede doar ale sale, Manager vede toate
exports.getTransactions = async (req, res) => {
  try {
    const { status, type, category, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Angajatul vede doar tranzacțiile create de el
    if (req.user.role === 'Angajat') {
      filter.createdBy = req.user._id;
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    


    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('stockItem', 'name quantity unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/transactions/:id
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email role')
      .populate('approvedBy', 'firstName lastName')
      .populate('stockItem', 'name quantity unit minQuantity');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Tranzacția nu a fost găsită.' });
    }

    // Angajatul poate vedea doar tranzacțiile lui
    if (
      req.user.role === 'Angajat' &&
      transaction.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Nu ai acces la această tranzacție.' });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/transactions/:id/approve — DOAR Manager
// AUTOMATIZARE CRITICĂ: aprobarea declanșează actualizarea soldului ȘI a stocului
exports.approveTransaction = async (req, res) => {
  try {
    const { managerNote } = req.body;
    const transaction = await Transaction.findById(req.params.id).populate('stockItem');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Tranzacția nu a fost găsită.' });
    }

    if (transaction.status !== 'În așteptare') {
      return res.status(400).json({
        success: false,
        message: `Tranzacția are deja statusul "${transaction.status}" și nu poate fi reaprobată.`,
      });
    }

    // AUTOMATIZARE STOC: se execută DOAR la aprobare
    // Angajatul a specificat produsul și cantitatea la creare
    // Acum sistemul aplică modificarea
    if (
      transaction.category === 'Stoc produse' &&
      transaction.stockItem &&
      transaction.stockQuantityDelta > 0
    ) {
      const stock = await Stock.findById(transaction.stockItem._id);
      if (stock) {
        if (transaction.type === 'Cheltuială') {
          // Cheltuială = cumpărăm marfă = stocul CREȘTE
          stock.quantity = stock.quantity + transaction.stockQuantityDelta;
        } else {
          // Venit = vindem marfă = stocul SCADE
          // FIXED
if (transaction.type === 'Venit') {
  if (stock.quantity < transaction.stockQuantityDelta) {
    return res.status(400).json({
      success: false,
      message: `Stoc insuficient. Disponibil: ${stock.quantity}, necesar: ${transaction.stockQuantityDelta}.`,
    });
  }
  stock.quantity -= transaction.stockQuantityDelta;
} else {
  stock.quantity += transaction.stockQuantityDelta;
}
        }
        await stock.save();
      }
    }

    // Aprobăm tranzacția
    transaction.status = 'Aprobat';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    if (managerNote !== undefined) transaction.managerNote = managerNote;
    await transaction.save();

    await transaction.populate('createdBy', 'firstName lastName');
    await transaction.populate('approvedBy', 'firstName lastName');
    if (transaction.stockItem) {
      await transaction.populate('stockItem', 'name quantity unit');
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/transactions/:id/reject — DOAR Manager
exports.rejectTransaction = async (req, res) => {
  try {
    const { reason, managerNote } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Tranzacția nu a fost găsită.' });
    }

    if (transaction.status !== 'În așteptare') {
      return res.status(400).json({
        success: false,
        message: `Tranzacția are deja statusul "${transaction.status}".`,
      });
    }

    // La respingere NU se modifică nimic în stoc sau sold
    transaction.status = 'Respins';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    const note = managerNote || reason || '';
    transaction.rejectionReason = note;
    transaction.managerNote = note;
    await transaction.save();

    await transaction.populate('createdBy', 'firstName lastName');
    await transaction.populate('approvedBy', 'firstName lastName');

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/transactions/:id — Angajat poate edita propria tranzacție în așteptare
exports.updateTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Tranzacția nu a fost găsită.' });

    if (txn.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Nu ai permisiunea să editezi această tranzacție.' });

    if (txn.status === 'Aprobat')
      return res.status(400).json({ success: false, message: 'Nu poți edita o tranzacție aprobată.' });

    const allowed = ['type', 'documentType', 'documentNumber', 'supplier', 'cui', 'category',
      'netAmount', 'tva', 'totalAmount', 'dueDate', 'paymentMethod', 'notes',
      'stockItem', 'stockQuantityDelta', 'bankAccount', 'issueDate', 'paymentStatus'];
    if (req.body.stockItem === '') req.body.stockItem = null;
    allowed.forEach(f => { if (req.body[f] !== undefined) txn[f] = req.body[f]; });

    // Re-submit for approval if it was previously rejected
    if (txn.status === 'Respins') {
      txn.status = 'În așteptare';
      txn.rejectionReason = '';
      txn.approvedBy = null;
      txn.approvedAt = null;
    }

    const net = parseFloat(txn.netAmount) || 0;
    const tva = parseFloat(txn.tva) || 0;
    txn.totalAmount = +(net + net * tva / 100).toFixed(2);

    if (txn.category === 'Stoc produse' && txn.stockItem) {
  const stockExists = await Stock.findById(txn.stockItem);
  if (!stockExists) {
    return res.status(404).json({
      success: false,
      message: 'Produsul selectat nu mai există în nomenclator.',
    });
  }
}

    await txn.save();
    await txn.populate('createdBy', 'firstName lastName');
    await txn.populate('approvedBy', 'firstName lastName');

    res.status(200).json({ success: true, data: txn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/transactions/:id — Angajat poate șterge propria tranzacție în așteptare
exports.deleteTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Tranzacția nu a fost găsită.' });

    if (txn.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Nu ai permisiunea să ștergi această tranzacție.' });

    if (txn.status === 'Aprobat')
      return res.status(400).json({ success: false, message: 'Nu poți șterge o tranzacție aprobată.' });

    req._auditOriginalDoc = { supplier: txn.supplier, documentNumber: txn.documentNumber, type: txn.type };
    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Tranzacție ștearsă.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/transactions/stats/dashboard — Manager vede tot, Angajat vede limitat
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Angajatul vede doar statistici pentru tranzacțiile lui
    const baseFilter = {};

    const [incomeAgg, expenseAgg, categoryAgg, balanceAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...baseFilter, type: 'Venit', status: 'Aprobat', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...baseFilter, type: 'Cheltuială', status: 'Aprobat', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...baseFilter, type: 'Cheltuială', status: 'Aprobat', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: '$category', total: { $sum: '$totalAmount' } } },
      ]),
      Transaction.aggregate([
  { $match: { ...baseFilter, status: 'Aprobat', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
  {
    $group: {
      _id: null,
      income: { $sum: { $cond: [{ $eq: ['$type', 'Venit'] }, '$totalAmount', 0] } },
      expenses: { $sum: { $cond: [{ $eq: ['$type', 'Cheltuială'] }, '$totalAmount', 0] } },
    },
  },
]),
    ]);

    const pendingFilter = req.user.role === 'Angajat'
      ? { status: 'În așteptare', createdBy: req.user._id }
      : { status: 'În așteptare' };

    const pendingCount = await Transaction.countDocuments(pendingFilter);

    // Breakdown pe ultimele 6 luni
    const lunaNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthDates = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return { label: lunaNames[d.getMonth()], year: d.getFullYear(), start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59) };
    });

    // Breakdown pe ultimele 4 trimestre
    const currentQ = Math.floor(now.getMonth() / 3);
    const quarterDates = Array.from({ length: 4 }, (_, idx) => {
      let q = currentQ - (3 - idx); let y = now.getFullYear();
      if (q < 0) { q += 4; y -= 1; }
      return { label: `T${q + 1} '${String(y).slice(2)}`, start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 0, 23, 59, 59) };
    });

    // Breakdown pe ultimii 3 ani
    const yearDates = [2, 1, 0].map(i => {
      const y = now.getFullYear() - i;
      return { label: String(y), start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) };
    });

    const makeBreakdownQueries = (dates) =>
      Promise.all(dates.map(({ start, end }) =>
        Promise.all([
          Transaction.aggregate([{ $match: { ...baseFilter, type: 'Venit', status: 'Aprobat', createdAt: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
          Transaction.aggregate([{ $match: { ...baseFilter, type: 'Cheltuială', status: 'Aprobat', createdAt: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        ])
      ));

    const [monthlyResults, quarterlyResults, yearlyResults] = await Promise.all([
      makeBreakdownQueries(monthDates),
      makeBreakdownQueries(quarterDates),
      makeBreakdownQueries(yearDates),
    ]);

    const monthlyBreakdown  = monthDates.map(({ label, year }, i)  => ({ month: label, year, income: monthlyResults[i][0][0]?.total || 0, expenses: monthlyResults[i][1][0]?.total || 0 }));
    const quarterlyBreakdown = quarterDates.map(({ label }, i) => ({ month: label, income: quarterlyResults[i][0][0]?.total || 0, expenses: quarterlyResults[i][1][0]?.total || 0 }));
    const yearlyBreakdown   = yearDates.map(({ label }, i)   => ({ month: label, income: yearlyResults[i][0][0]?.total || 0, expenses: yearlyResults[i][1][0]?.total || 0 }));

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const balance = totalIncome - totalExpenses;
    res.status(200).json({
      success: true,
      data: {
        balance,
        monthlyIncome: totalIncome,
        monthlyExpenses: totalExpenses,
        netProfit: totalIncome - totalExpenses,
        pendingCount,
        categoryBreakdown: categoryAgg,
        monthlyBreakdown,
        quarterlyBreakdown,
        yearlyBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
