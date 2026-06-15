const express = require('express');
const { getLogs, getActiveUsers } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware'); // ← vezi nota de mai jos

const router = express.Router();

router.get('/', protect, getLogs);
router.get('/users', protect, getActiveUsers);

module.exports = router;