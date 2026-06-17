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
const User = require('../models/User'); // Modelul de utilizator
const rateLimit = require('express-rate-limit');

// CORECTURĂ: Importăm funcția auditLog din obiectul exportat
const { auditLog } = require('../middleware/auditLogger');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Prea multe încercări. Încearcă din nou în 15 minute.' }
});

// ==========================================
// RUTE PUBLICE
// ==========================================
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// CORECTURĂ: Utilizăm funcția auditLog, specificând acțiunea și entitatea corespunzătoare
router.post('/logout', protect, auditLog('LOGOUT', 'User'), (req, res) => {
  return res.status(200).json({ success: true, message: 'Delogare reușită din sistem.' });
});

// ==========================================
// RUTE PROTEJATE (Necesită doar să fii logat)
// ==========================================
router.get('/me', protect, getMe);

// Schimbare Parolă (PUT /api/auth/update-password)
router.put('/update-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Te rugăm să introduci atât parola curentă, cât și cea nouă.' 
      });
    }

    // Încărcăm utilizatorul cu tot cu parolă pentru verificare
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilizatorul nu a fost găsit.' });
    }

    // Verificăm dacă parola introdusă se potrivește cu cea din DB
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Parola curentă este incorectă.' });
    }

    // Generăm hash-ul o singură dată folosind librăria stabilă bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Salvare directă prin ID pentru a evita criptarea dublă
    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    return res.status(200).json({ success: true, message: 'Parola a fost salvată în baza de date!' });
  } catch (error) {
    console.error('Eroare update-password:', error);
    return res.status(500).json({ success: false, message: 'Eroare de server la actualizarea parolei.' });
  }
});

// ==========================================
// RUTE ADMINISTRATIVE (Doar Manager)
// ==========================================
router.get('/users', protect, restrictTo('Manager'), getUsers);
router.patch('/users/:id/role', protect, restrictTo('Manager'), updateUserRole);
router.patch('/users/:id/toggle-active', protect, restrictTo('Manager'), toggleUserActive);

router.delete('/me', protect, async (req, res) => {
  try {
    if (req.user.role === 'Manager') {
      const managerCount = await User.countDocuments({ role: 'Manager', isActive: true });
      if (managerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Nu poți șterge singurul cont de Manager activ.',
        });
      }
    }
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ success: true, message: 'Contul a fost șters.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// GET /api/auth/worklogs/weekly — calculates hours from LOGIN/LOGOUT audit events
router.get('/worklogs/weekly', protect, async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const events = await AuditLog.find({
      userId: req.user._id,
      action: { $in: ['LOGIN', 'LOGOUT'] },
      createdAt: { $gte: fourWeeksAgo }
    }).sort({ createdAt: 1 });

    // Pair LOGIN -> LOGOUT sessions
    const sessions = [];
    let openLogin = null;

    for (const event of events) {
      if (event.action === 'LOGIN') {
        openLogin = event;
      } else if (event.action === 'LOGOUT' && openLogin) {
        const hours = (new Date(event.createdAt) - new Date(openLogin.createdAt)) / 3600000;
        sessions.push({ date: openLogin.createdAt, hours: parseFloat(hours.toFixed(2)) });
        openLogin = null;
      }
    }

    // Group by ISO week number
    const weekMap = {};
    sessions.forEach(({ date, hours }) => {
      const d = new Date(date);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      const key = `Săpt ${week}`;
      weekMap[key] = parseFloat(((weekMap[key] || 0) + hours).toFixed(1));
    });

    
      // Return last 4 weeks sorted ascending by week number
const result = Object.entries(weekMap)
  .map(([week, ore]) => ({ week, ore }))
  .sort((a, b) => {
    const numA = parseInt(a.week.replace('Săpt ', ''))
    const numB = parseInt(b.week.replace('Săpt ', ''))
    return numA - numB
  })
  .slice(-4)

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;