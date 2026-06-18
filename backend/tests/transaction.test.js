const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Counter = require('../models/Counter');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
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
    role: 'Angajat',
    isActive: true,
  });
}

describe('Tranzacții', () => {

  test('tranzacția nouă are statusul "În așteptare"', async () => {
    const user = await createUser();
    const txn = await Transaction.create({
      type: 'Cheltuială',
      documentType: 'Factură',
      supplier: 'Firma Test',
      category: 'Furnizori',
      netAmount: 200,
      tva: 19,
      totalAmount: 238,
      createdBy: user._id,
    });
    expect(txn.status).toBe('În așteptare');
  });

  test('referința tranzacției este generată automat în formatul corect', async () => {
    const user = await createUser();
    const txn = await Transaction.create({
      type: 'Cheltuială',
      documentType: 'Factură',
      supplier: 'Electro SRL',
      category: 'Furnizori',
      netAmount: 100,
      tva: 19,
      totalAmount: 119,
      createdBy: user._id,
    });
    expect(txn.reference).toBeDefined();
    expect(txn.reference).toMatch(/^TXN-[A-Z]{2}-\d{4}$/);
  });

  test('două tranzacții primesc referințe unice diferite', async () => {
    const user = await createUser();
    const data = {
      type: 'Cheltuială',
      documentType: 'Factură',
      category: 'Furnizori',
      netAmount: 100,
      tva: 19,
      totalAmount: 119,
      createdBy: user._id,
    };
    const [t1, t2] = await Promise.all([
      Transaction.create({ ...data, supplier: 'Firma A' }),
      Transaction.create({ ...data, supplier: 'Firma B' }),
    ]);
    expect(t1.reference).not.toBe(t2.reference);
  });

});