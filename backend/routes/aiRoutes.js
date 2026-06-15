const express = require('express'); // Am curățat duplicatul și greșeala de tipar!
const router = express.Router();
const { chatWithAssistant } = require('../controllers/aiController'); 
const { protect } = require('../middleware/authMiddleware');

// Endpoint-ul final va fi /api/ai-assistant/chat
router.post('/chat', protect, chatWithAssistant);

module.exports = router;