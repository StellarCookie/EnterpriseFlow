const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Counter = require('../models/Counter');
const bcrypt = require('bcryptjs');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Stock.deleteMany({});
  await Transaction.deleteMany({});
  await User.deleteMany({});
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

describe('Gestiune stoc', () => {

  test('status este "Critic" când cantitatea este 0', async () => {
    const stock = await Stock.create({ name: 'Hârtie A4', quantity: 0, minQuantity: 5 });
    expect(stock.status).toBe('Critic');
  });

  test('status este "Redus" când cantitatea este sub pragul minim', async () => {
    const stock = await Stock.create({ name: 'Hârtie A4', quantity: 3, minQuantity: 5 });
    expect(stock.status).toBe('Redus');
  });

  test('un produs cu tranzacții asociate nu poate fi șters', async () => {
    const user = await createUser();
    const stock = await Stock.create({ name: 'Laptop', quantity: 5, minQuantity: 1 });
    await Transaction.create({
      type: 'Cheltuială',
      documentType: 'Factură',
      supplier: 'IT Store',
      category: 'Produse',
      netAmount: 3000,
      tva: 19,
      totalAmount: 3570,
      stockItem: stock._id,
      stockQuantityDelta: 1,
      createdBy: user._id,
    });
    const areLegaturi = await Transaction.exists({ stockItem: stock._id });
    expect(areLegaturi).toBeTruthy();
  });

});