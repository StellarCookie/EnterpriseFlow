const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
    },
    type: {
      type: String,
      enum: ['Venit', 'Cheltuială'],
      required: [true, 'Tipul tranzacției este obligatoriu'],
    },
    documentType: {
      type: String,
      required: true,
    },
    // --- CÂMPURI NOI ADĂUGATE ---
    documentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bankAccount: {
      type: String,
      trim: true,
      default: '', // IBAN-ul extras de pe factură
    },
    issueDate: {
      type: Date,
      default: null, // Data emiterii înscrisă pe document
    },
    paymentStatus: {
      type: String,
      enum: ['Neplătit', 'Plătit', 'În curs'],
      default: 'Neplătit',
    },
    // ----------------------------
    supplier: {
      type: String,
      required: [true, 'Furnizorul/Clientul este obligatoriu'],
      trim: true,
    },
    cui: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Categoria este obligatorie'],
    },
    netAmount: {
      type: Number,
      required: [true, 'Suma netă este obligatorie'],
      min: 0,
    },
    tva: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date, // Rămâne neschimbat: data limită pentru aprobarea managerului
    },
    paymentMethod: {
      type: String,
      default: 'Transfer bancar',
    },
    status: {
      type: String,
      enum: ['În așteptare', 'Aprobat', 'Respins'],
      default: 'În așteptare',
    },
    notes: {
      type: String,
      trim: true,
    },
    pdfPath: {
      type: String,
    },
    stockItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock',
      default: null,
    },
    stockQuantityDelta: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    managerNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

transactionSchema.pre('save', function (next) {
  if (!this.reference) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.reference = `TXN-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);