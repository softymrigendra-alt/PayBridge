import request from 'supertest';
import app from '../app';

describe('POST /api/webhooks/stripe', () => {
  it('returns 400 without stripe-signature header', async () => {
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .send('{}');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 with invalid signature', async () => {
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'invalid_signature')
      .send('{}');
    expect(res.status).toBe(400);
  });
});
