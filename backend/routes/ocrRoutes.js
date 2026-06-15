const express = require('express');
const router = express.Router();
const multer = require('multer');
const ocrController = require('../controllers/ocrController');
const { protect } = require('../middleware/authMiddleware');

// Configurare folder temporar pentru upload-uri
const upload = multer({ dest: 'uploads/' });

router.post('/scan', protect, upload.single('invoice'), ocrController.scanInvoice);

module.exports = router;