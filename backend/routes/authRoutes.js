const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getUsers,
  updateUserRole,
  toggleUserActive,
} = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Publice
router.post('/register', register);
router.post('/login', login);

// Protejate (necesită login)
router.get('/me', protect, getMe);

// Doar Manager
router.get('/users', protect, restrictTo('Manager'), getUsers);
router.patch('/users/:id/role', protect, restrictTo('Manager'), updateUserRole);
router.patch('/users/:id/toggle-active', protect, restrictTo('Manager'), toggleUserActive);

module.exports = router;
