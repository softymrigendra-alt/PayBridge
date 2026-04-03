import request from 'supertest';
import app from '../app';
import { prisma } from '../db/client';
import bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('../db/client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notanemail', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for unknown user', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correct_password', 10);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user_1',
      email: 'test@test.com',
      passwordHash: hash,
      name: 'Test User',
      role: 'analyst',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong_password' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with token for valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 10);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user_1',
      email: 'test@test.com',
      passwordHash: hash,
      name: 'Test User',
      role: 'admin',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@test.com');
  });
});
