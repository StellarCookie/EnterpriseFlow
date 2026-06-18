const mongoose = require('mongoose');
const Counter = require('./Counter');

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
    documentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bankAccount: {
      type: String,
      trim: true,
      default: '',
    },
    issueDate: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['Neplătit', 'Plătit', 'În curs'],
      default: 'Neplătit',
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
    managerNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

transactionSchema.pre('save', async function (next) {
  if (!this.reference) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.createdBy);

      let initials = 'US';
      if (user && user.firstName && user.lastName) {
        initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
      }

      // Counter.next() is a single atomic MongoDB operation ($inc + upsert).
      // No matter how many transactions are saved at the same time, each gets
      // a unique sequence number — no race condition possible.
      const seq = await Counter.next('transaction');
      const formattedNumber = String(seq).padStart(4, '0');

      this.reference = `TXN-${initials}-${formattedNumber}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);