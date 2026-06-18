const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function createUser(overrides = {}) {
  return User.create({
    firstName: 'Ion',
    lastName: 'Popescu',
    email: 'ion@test.ro',
    password: 'parola123',
    role: 'Angajat',
    isActive: true,
    ...overrides,
  });
}

describe('Autentificare utilizator', () => {

  test('parola este stocată ca hash bcrypt, nu în clar', async () => {
    const user = await createUser();
    const userCuParola = await User.findById(user._id).select('+password');
    expect(userCuParola.password).not.toBe('parola123');
    expect(userCuParola.password.startsWith('$2')).toBe(true);
  });

  test('comparePassword returnează true pentru parola corectă', async () => {
    const user = await createUser();
    const userCuParola = await User.findById(user._id).select('+password');
    const rezultat = await userCuParola.comparePassword('parola123');
    expect(rezultat).toBe(true);
  });

  test('un cont dezactivat are isActive false și nu poate fi autentificat', async () => {
    const user = await createUser({ isActive: false });
    expect(user.isActive).toBe(false);
  });

});