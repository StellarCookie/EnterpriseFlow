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

transactionSchema.pre('save', async function (next) {
  if (!this.reference) {
    try {
      // Preluăm dinamic modelul User pentru a nu face require circular la începutul fișierului
      const User = mongoose.model('User');
      const user = await User.findById(this.createdBy);
      
      let initials = 'US'; // Cod implicit dacă nu găsește utilizatorul
      if (user && user.firstName && user.lastName) {
        // Extragem prima literă din prenume și prima din nume
        initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
      }

      // Căutăm ultima tranzacție salvată în baza de date pentru a vedea numărul secvențial
      const lastTransaction = await this.constructor.findOne({}, { reference: 1 })
        .sort({ createdAt: -1 });

      let nextNumber = 1;
      if (lastTransaction && lastTransaction.reference) {
        // Luăm ultima bucată din cod (care conține numărul, de ex: "0004")
        const parts = lastTransaction.reference.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }

      // Formatăm numărul cu 4 cifre (ex: 1 devine 0001, 12 devine 0012)
      const formattedNumber = String(nextNumber).padStart(4, '0');
      
      // Construim ID-ul final: ex. TXN-AN-0001, TXN-AN-0002 etc.
      this.reference = `TXN-${initials}-${formattedNumber}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);