const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiAssistantController');
const { protect } = require('../middleware/authMiddleware'); // Middleware-ul tău existent

// Doar utilizatorii autentificați pot discuta cu asistentul
router.post('/chat', protect, aiController.askAssistant);

module.exports = router;