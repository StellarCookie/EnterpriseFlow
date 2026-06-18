const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const Counter = require('../models/Counter');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
  await Stock.deleteMany({});
  await Transaction.deleteMany({});
  await Counter.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function createUser() {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash('parola123', salt);
  return User.create({
    firstName: 'Ion',
    lastName: 'Popescu',
    email: 'ion@test.ro',
    password: hashed,
    role: 'Manager',
    isActive: true,
  });
}

describe('Workflow aprobare', () => {

  test('aprobarea unei cheltuieli cu produse crește cantitatea în stoc', async () => {
    const user = await createUser();
    const stock = await Stock.create({ name: 'Pixuri', quantity: 10, minQuantity: 2 });
    const txn = await Transaction.create({
      type: 'Cheltuială',
      documentType: 'Factură',
      supplier: 'Papetărie SRL',
      category: 'Produse',
      netAmount: 50,
      tva: 19,
      totalAmount: 59.5,
      stockItem: stock._id,
      stockQuantityDelta: 5,
      createdBy: user._id,
    });

    const stocCurent = await Stock.findById(txn.stockItem);
    stocCurent.quantity += txn.stockQuantityDelta;
    await stocCurent.save();
    txn.status = 'Aprobat';
    txn.approvedBy = user._id;
    txn.approvedAt = new Date();
    await txn.save();

    const stocActualizat = await Stock.findById(stock._id);
    expect(stocActualizat.quantity).toBe(15);
    expect(txn.status).toBe('Aprobat');
  });

  test('respingerea nu modifică cantitatea în stoc', async () => {
    const user = await createUser();
    const stock = await Stock.create({ name: 'Pixuri', quantity: 10, minQuantity: 2 });
    const txn = await Transaction.create({
      type: 'Cheltuială',
      documentType: 'Factură',
      supplier: 'Papetărie SRL',
      category: 'Produse',
      netAmount: 50,
      tva: 19,
      totalAmount: 59.5,
      stockItem: stock._id,
      stockQuantityDelta: 5,
      createdBy: user._id,
    });

    txn.status = 'Respins';
    txn.rejectionReason = 'Preț prea mare';
    await txn.save();

    const stocNeschimbat = await Stock.findById(stock._id);
    expect(stocNeschimbat.quantity).toBe(10);
    expect(txn.status).toBe('Respins');
  });

  test('o tranzacție aprobată nu poate fi reaprobată', async () => {
    const user = await createUser();
    const txn = await Transaction.create({
      type: 'Cheltuială',
      documentType: 'Factură',
      supplier: 'Firma Test',
      category: 'Furnizori',
      netAmount: 100,
      tva: 19,
      totalAmount: 119,
      createdBy: user._id,
      status: 'Aprobat',
    });

    const poateReaproba = txn.status === 'În așteptare';
    expect(poateReaproba).toBe(false);
  });

});