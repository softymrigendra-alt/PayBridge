import request from 'supertest';
import app from '../app';
import { prisma } from '../db/client';
import jwt from 'jsonwebtoken';

jest.mock('../db/client', () => ({
  prisma: {
    opportunity: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function makeToken(role = 'admin') {
  return jwt.sign(
    { userId: 'user_1', email: 'admin@test.com', role },
    process.env['JWT_SECRET'] ?? 'test-secret-key-minimum-32-characters-long',
  );
}

const token = makeToken();

const sampleOpportunity = {
  id: 'opp_1',
  salesforceId: 'sf_opp_001',
  name: 'Test Opportunity',
  accountName: 'Test Account',
  accountId: 'acc_1',
  hostEmail: 'test@example.com',
  amount: 10000,
  stage: 'Closed Won',
  closeDate: new Date().toISOString(),
  status: 'PENDING',
  errorMessage: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  invoice: null,
  stripeAccount: null,
  payments: [],
};

describe('GET /api/opportunities', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(401);
  });

  it('returns paginated opportunities', async () => {
    (mockPrisma.opportunity.findMany as jest.Mock).mockResolvedValue([sampleOpportunity]);
    (mockPrisma.opportunity.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .get('/api/opportunities')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(1);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Test Opportunity');
  });
});

describe('GET /api/opportunities/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for unknown opportunity', async () => {
    (mockPrisma.opportunity.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/opportunities/nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns opportunity with relations', async () => {
    (mockPrisma.opportunity.findUnique as jest.Mock).mockResolvedValue({
      ...sampleOpportunity,
      auditLogs: [],
    });

    const res = await request(app)
      .get('/api/opportunities/opp_1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('opp_1');
  });
});
