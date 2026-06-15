const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransaction,
  approveTransaction,
  rejectTransaction,
  getDashboardStats,
} = require('../controllers/transactionController');
const Transaction = require('../models/Transaction');
const Stock = require('../models/Stock');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { auditLog } = require('../middleware/auditLogger');

router.use(protect);

router.get('/stats/dashboard', getDashboardStats);

router.get('/report/monthly', restrictTo('Manager'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const newStockItems = await Stock.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ createdAt: -1 });

    const approved = transactions.filter(t => t.status === 'Aprobat');
    const income = approved.filter(t => t.type === 'Venit').reduce((s, t) => s + t.totalAmount, 0);
    const expenses = approved.filter(t => t.type === 'Cheltuială').reduce((s, t) => s + t.totalAmount, 0);

    res.json({
      transactions,
      newStockItems,
      stats: {
        balance: income - expenses,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        netProfit: income - expenses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', getTransactions);
router.get('/:id', getTransaction);

router.post('/',
  auditLog('CREATE', 'Order', (req, data) => {
    const t = data.data;
    // ex: "Cheltuială — Stoc produse — 1.200 RON"
    return `${t?.type || 'Tranzacție'} — ${t?.category || t?.supplier || 'nouă'} — ${t?.totalAmount ? t.totalAmount + ' RON' : ''}`.trim();
  }),
  createTransaction
);

router.patch('/:id/approve',
  restrictTo('Manager'),
  auditLog('UPDATE', 'Order', (req, data) => {
    const t = data.data;
    return `Aprobare — ${t?.type || ''} ${t?.category || t?.supplier || ''} — ${t?.totalAmount ? t.totalAmount + ' RON' : ''}`.trim();
  }),
  approveTransaction
);

router.patch('/:id/reject',
  restrictTo('Manager'),
  auditLog('UPDATE', 'Order', (req, data) => {
    const t = data.data;
    return `Respingere — ${t?.type || ''} ${t?.category || t?.supplier || ''} — ${t?.totalAmount ? t.totalAmount + ' RON' : ''}`.trim();
  }),
  rejectTransaction
);

module.exports = router;