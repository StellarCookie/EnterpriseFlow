require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const stockRoutes = require('./routes/stockRoutes');
const audit = require('./routes/audit'); 
const ocrRoutes = require('./routes/ocrRoutes');
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');
const aiRoutes = require('./routes/aiRoutes');

connectDB();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/audit', audit);                
app.use('/api/ocr', ocrRoutes);
app.use('/api/assistant', aiAssistantRoutes);
app.use('/api/ai-assistant', aiRoutes); // Rute pentru funcționalități AI generale (ex: sumarizare, analiză de text, etc.)
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), app: 'EnterpriseFlow API' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Ruta '${req.originalUrl}' nu există.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Eroare internă de server.',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EnterpriseFlow API pornit pe portul ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});