const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Prenumele este obligatoriu'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Numele este obligatoriu'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email-ul este obligatoriu'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalid'],
    },
    password: {
      type: String,
      required: [true, 'Parola este obligatorie'],
      minlength: [6, 'Parola trebuie să aibă minimum 6 caractere'],
      select: false,
    },
    role: {
      type: String,
      enum: ['Manager', 'Angajat'],
      default: 'Angajat',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    title: { type: String, default: '' },
    mustChangePassword: { type: Boolean, default: false },
  },
  
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
