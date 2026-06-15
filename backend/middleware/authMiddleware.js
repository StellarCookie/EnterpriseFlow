const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifică token JWT și atașează user la request
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Nu ești autentificat. Te rugăm să te loghezi.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilizatorul nu mai există sau este inactiv.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalid sau expirat.',
    });
  }
};

// Restricționează accesul la anumite roluri
// Exemplu: restrictTo('Manager') — doar managerul trece
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acces interzis. Rolul "${req.user.role}" nu are permisiunea necesară pentru această acțiune.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
