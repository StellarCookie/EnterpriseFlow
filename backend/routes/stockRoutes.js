const express = require('express');
const router = express.Router();
const {
  getStocks,
  getStock,
  createStock,
  updateStock,
  deleteStock,
} = require('../controllers/stockController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { auditLog } = require('../middleware/auditLogger');  // ← NOU

router.use(protect);

router.get('/', getStocks);
router.get('/:id', getStock);

router.post('/',
  restrictTo('Angajat'),
  auditLog('CREATE', 'Stock', (req, data) => data?.data?.name || 'Stoc nou'),
  createStock
);

router.patch('/:id',
  restrictTo('Angajat'),
  auditLog('UPDATE', 'Stock', (req, data) => data?.data?.name || req._auditOriginalDoc?.name || `ID: ${req.params.id}`),
  updateStock
);

router.delete('/:id',
  restrictTo('Angajat'),
  auditLog('DELETE', 'Stock', (req) => req._auditOriginalDoc?.name || `ID: ${req.params.id}`),
  deleteStock
);

module.exports = router;