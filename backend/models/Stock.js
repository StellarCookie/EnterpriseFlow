const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Denumirea produsului este obligatorie'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cantitatea nu poate fi negativă'],
    },
    minQuantity: {
      type: Number,
      default: 2,
      min: 0,
    },
    unit: {
      type: String,
      default: 'buc.',
      trim: true,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
    },
    // Cine a adăugat produsul în nomenclator (de obicei Angajat)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Status calculat dinamic din cantitate vs prag minim
stockSchema.virtual('status').get(function () {
  if (this.quantity === 0) return 'Critic';
  if (this.quantity <= this.minQuantity) return 'Redus';
  return 'OK';
});

stockSchema.set('toJSON', { virtuals: true });
stockSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Stock', stockSchema);
