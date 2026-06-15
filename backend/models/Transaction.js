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
    currency: {
      type: String,
      default: 'RON',
    },
    dueDate: {
      type: Date,
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
  },
  { timestamps: true }
);

transactionSchema.pre('save', async function (next) {
  if (!this.reference) {
    const count = await mongoose.model('Transaction').countDocuments();
    this.reference = `TXN-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
