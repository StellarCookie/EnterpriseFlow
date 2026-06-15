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
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Modelul tău de utilizator

// ==========================================
// RUTE PUBLICE
// ==========================================
router.post('/register', register);
router.post('/login', login);

// ==========================================
// RUTE PROTEJATE (Necesită doar să fii logat)
// ==========================================
router.get('/me', protect, getMe);

// 1. Schimbare Parolă (PUT /api/auth/update-password)
router.put('/update-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Te rugăm să introduci atât parola curentă, cât și cea nouă.' 
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilizatorul nu a fost găsit.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Parola curentă este incorectă.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: 'Parola a fost salvată în baza de date!' });
  } catch (error) {
    console.error('Eroare update-password:', error);
    return res.status(500).json({ success: false, message: 'Eroare de server la actualizarea parolei.' });
  }
});

// 2. Actualizare Funcție/Title (PATCH /api/auth/update-title) -> ACUM ESTE SEPARATĂ ȘI CORECTĂ!
router.patch('/update-title', protect, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Funcția nu poate fi goală.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilizatorul nu a fost găsit.' });
    }

    user.title = title;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Funcția profesională a fost actualizată!' 
    });
  } catch (error) {
    console.error('Eroare update-title:', error);
    return res.status(500).json({ success: false, message: 'Eroare la salvarea funcției.' });
  }
});

// ==========================================
// RUTE ADMINISTRATIVE (Doar Manager)
// ==========================================
router.get('/users', protect, restrictTo('Manager'), getUsers);
router.patch('/users/:id/role', protect, restrictTo('Manager'), updateUserRole);
router.patch('/users/:id/toggle-active', protect, restrictTo('Manager'), toggleUserActive);

module.exports = router;