/**
 * Standalone Vercel serverless handler — demo mode.
 * Implements the full AR Service API with realistic mock data.
 * No database, no external SDKs — works entirely in-memory.
 */
import type { IncomingMessage, ServerResponse } from 'http';
import { createHmac } from 'crypto';

// ── JWT helpers (no external dep) ─────────────────────────────────────────────
const JWT_SECRET = process.env['JWT_SECRET'] ?? 'demo-secret-key-minimum-32-characters-ok';

function b64url(s: string) {
  return Buffer.from(s).toString('base64url');
}
function makeToken(payload: object): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }));
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}
function verifyToken(token: string): boolean {
  try {
    const [header, body, sig] = token.split('.');
    const expected = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return false;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_USER = { id: 'u1', email: 'admin@arservice.com', name: 'Admin User', role: 'admin' };

const OPPS = [
  {
    id: 'demo_opp_001', salesforceId: 'sf_001', name: 'TechCorp Annual License Q1',
    accountName: 'TechCorp Inc.', accountId: 'sf_acc_001', hostEmail: 'billing@techcorp.com',
    amount: 48000, stage: 'Closed Won', closeDate: '2026-01-15T00:00:00.000Z',
    status: 'PAYMENT_SUCCEEDED', errorMessage: null,
    createdAt: '2026-01-15T10:00:00.000Z', updatedAt: '2026-01-20T10:00:00.000Z',
    invoice: { id: 'inv1', netsuiteId: 'ns_inv_001', opportunityId: 'demo_opp_001', dueDate: '2026-02-15T00:00:00.000Z', totalAmount: 48000, status: 'PAID', fetchedAt: '2026-01-16T10:00:00.000Z', lineItems: [{ description: 'Enterprise License — Annual', quantity: 1, unitPrice: 40000, amount: 40000 }, { description: 'Priority Support Package', quantity: 1, unitPrice: 8000, amount: 8000 }] },
    stripeAccount: { id: 'sa1', stripeAccountId: 'acct_demo_techcorp', onboardingStatus: 'COMPLETE', onboardingUrl: null, detailsSubmitted: true, chargesEnabled: true, createdAt: '2026-01-17T10:00:00.000Z' },
    payments: [{ id: 'pr1', stripePaymentIntentId: 'pi_demo_001', amount: 48000, currency: 'usd', status: 'SUCCEEDED', retryCount: 0, paidAt: '2026-01-20T10:00:00.000Z', failureMessage: null, createdAt: '2026-01-20T10:00:00.000Z' }],
    auditLogs: [
      { id: 'al1', opportunityId: 'demo_opp_001', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-15T10:00:00.000Z' },
      { id: 'al2', opportunityId: 'demo_opp_001', event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_001' }, level: 'info', createdAt: '2026-01-16T10:00:00.000Z' },
      { id: 'al3', opportunityId: 'demo_opp_001', event: 'STRIPE_ACCOUNT_CREATED', metadata: { stripeAccountId: 'acct_demo_techcorp' }, level: 'info', createdAt: '2026-01-17T10:00:00.000Z' },
      { id: 'al4', opportunityId: 'demo_opp_001', event: 'HOST_INVITED', metadata: { email: 'billing@techcorp.com' }, level: 'info', createdAt: '2026-01-17T10:00:00.000Z' },
      { id: 'al5', opportunityId: 'demo_opp_001', event: 'ONBOARDING_COMPLETE', metadata: { stripeAccountId: 'acct_demo_techcorp' }, level: 'info', createdAt: '2026-01-18T10:00:00.000Z' },
      { id: 'al6', opportunityId: 'demo_opp_001', event: 'PAYMENT_SUCCEEDED', metadata: { amount: 48000 }, level: 'info', createdAt: '2026-01-20T10:00:00.000Z' },
    ],
  },
  {
    id: 'demo_opp_002', salesforceId: 'sf_002', name: 'StartupXYZ Platform Deal',
    accountName: 'StartupXYZ LLC', accountId: 'sf_acc_002', hostEmail: 'finance@startupxyz.io',
    amount: 15000, stage: 'Closed Won', closeDate: '2026-01-22T00:00:00.000Z',
    status: 'INVITE_SENT', errorMessage: null,
    createdAt: '2026-01-22T10:00:00.000Z', updatedAt: '2026-01-25T10:00:00.000Z',
    invoice: { id: 'inv2', netsuiteId: 'ns_inv_002', opportunityId: 'demo_opp_002', dueDate: '2026-02-28T00:00:00.000Z', totalAmount: 15000, status: 'OPEN', fetchedAt: '2026-01-23T10:00:00.000Z', lineItems: [{ description: 'Platform Access — 12 months', quantity: 1, unitPrice: 12000, amount: 12000 }, { description: 'Onboarding & Setup', quantity: 1, unitPrice: 3000, amount: 3000 }] },
    stripeAccount: { id: 'sa2', stripeAccountId: 'acct_demo_startup', onboardingStatus: 'PENDING', onboardingUrl: '/demo/onboarding?account=acct_demo_startup&return_url=/opportunities/demo_opp_002', detailsSubmitted: false, chargesEnabled: false, createdAt: '2026-01-24T10:00:00.000Z' },
    payments: [],
    auditLogs: [
      { id: 'al7', opportunityId: 'demo_opp_002', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-22T10:00:00.000Z' },
      { id: 'al8', opportunityId: 'demo_opp_002', event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_002' }, level: 'info', createdAt: '2026-01-23T10:00:00.000Z' },
      { id: 'al9', opportunityId: 'demo_opp_002', event: 'HOST_INVITED', metadata: { email: 'finance@startupxyz.io' }, level: 'info', createdAt: '2026-01-24T10:00:00.000Z' },
    ],
  },
  {
    id: 'demo_opp_003', salesforceId: 'sf_003', name: 'MegaRetail Holiday Campaign',
    accountName: 'MegaRetail Corp', accountId: 'sf_acc_003', hostEmail: 'ar@megaretail.com',
    amount: 125000, stage: 'Closed Won', closeDate: '2026-01-28T00:00:00.000Z',
    status: 'INVOICE_FETCHED', errorMessage: null,
    createdAt: '2026-01-28T10:00:00.000Z', updatedAt: '2026-01-29T10:00:00.000Z',
    invoice: { id: 'inv3', netsuiteId: 'ns_inv_003', opportunityId: 'demo_opp_003', dueDate: '2026-03-01T00:00:00.000Z', totalAmount: 125000, status: 'OPEN', fetchedAt: '2026-01-29T10:00:00.000Z', lineItems: [{ description: 'Campaign Management Platform', quantity: 1, unitPrice: 85000, amount: 85000 }, { description: 'Data Analytics Module', quantity: 1, unitPrice: 25000, amount: 25000 }, { description: 'Dedicated Support (12mo)', quantity: 1, unitPrice: 15000, amount: 15000 }] },
    stripeAccount: null, payments: [],
    auditLogs: [
      { id: 'al10', opportunityId: 'demo_opp_003', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-28T10:00:00.000Z' },
      { id: 'al11', opportunityId: 'demo_opp_003', event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_003' }, level: 'info', createdAt: '2026-01-29T10:00:00.000Z' },
    ],
  },
  {
    id: 'demo_opp_004', salesforceId: 'sf_004', name: 'FinServ Compliance Suite',
    accountName: 'FinServ Group', accountId: 'sf_acc_004', hostEmail: 'ops@finservgroup.com',
    amount: 92500, stage: 'Closed Won', closeDate: '2026-01-30T00:00:00.000Z',
    status: 'PENDING', errorMessage: null,
    createdAt: '2026-01-30T10:00:00.000Z', updatedAt: '2026-01-30T10:00:00.000Z',
    invoice: null, stripeAccount: null, payments: [],
    auditLogs: [{ id: 'al12', opportunityId: 'demo_opp_004', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-30T10:00:00.000Z' }],
  },
];

type Opp = typeof OPPS[0];

// Module-level mutable state — persists within a Vercel function instance (same session).
// Deep-clone the initial data so mutations don't affect the source array.
const OPP_MAP: Record<string, Opp> = Object.fromEntries(
  OPPS.map(o => [o.id, JSON.parse(JSON.stringify(o))])
);

// ── Request helpers ───────────────────────────────────────────────────────────
function getBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

function json(res: ServerResponse, status: number, body: unknown) {
  const s = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' });
  res.end(s);
}

function getAuth(req: IncomingMessage): boolean {
  const h = req.headers.authorization ?? '';
  if (!h.startsWith('Bearer ')) return false;
  return verifyToken(h.slice(7));
}

function getQuery(req: IncomingMessage): Record<string, string> {
  const url = req.url ?? '';
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  return Object.fromEntries(new URLSearchParams(url.slice(idx + 1)).entries());
}

function getPath(req: IncomingMessage): string {
  const url = req.url ?? '';
  const idx = url.indexOf('?');
  return idx === -1 ? url : url.slice(0, idx);
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const path = getPath(req);
  const method = req.method ?? 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' });
    return res.end();
  }

  // Health
  if (path === '/health') return json(res, 200, { status: 'ok', timestamp: new Date().toISOString(), env: 'production', demo: true });

  // Login
  if (path === '/api/auth/login' && method === 'POST') {
    const body = await getBody(req);
    if (body['email'] === 'admin@arservice.com' && body['password'] === 'admin123') {
      const token = makeToken({ userId: DEMO_USER.id, email: DEMO_USER.email, role: DEMO_USER.role });
      return json(res, 200, { success: true, data: { token, user: DEMO_USER } });
    }
    return json(res, 401, { success: false, error: 'Invalid email or password' });
  }

  // Me
  if (path === '/api/auth/me' && method === 'GET') {
    if (!getAuth(req)) return json(res, 401, { success: false, error: 'Unauthorized' });
    return json(res, 200, { success: true, data: DEMO_USER });
  }

  // All remaining routes require auth
  if (!getAuth(req)) return json(res, 401, { success: false, error: 'Missing or invalid Authorization header' });

  // Sync salesforce
  if (path === '/api/sync/salesforce' && method === 'POST') {
    return json(res, 200, { success: true, data: { synced: 4, created: 0, updated: 4, errors: [] }, message: 'Sync complete: 0 created, 4 updated, 0 errors' });
  }

  // Opportunities list
  if (path === '/api/opportunities' && method === 'GET') {
    const q = getQuery(req);
    let results: Opp[] = [...OPPS];
    if (q['status']) results = results.filter(o => o.status === q['status']);
    if (q['search']) { const s = q['search'].toLowerCase(); results = results.filter(o => o.name.toLowerCase().includes(s) || o.accountName.toLowerCase().includes(s) || o.hostEmail.toLowerCase().includes(s)); }
    const page = parseInt(q['page'] ?? '1'), limit = parseInt(q['limit'] ?? '20');
    return json(res, 200, { success: true, data: results.slice((page - 1) * limit, page * limit), total: results.length, page, limit });
  }

  // Opportunity detail
  const detailM = path.match(/^\/api\/opportunities\/(demo_opp_\w+)$/);
  if (detailM && method === 'GET') {
    const o = OPP_MAP[detailM[1]];
    if (!o) return json(res, 404, { success: false, error: 'Opportunity not found' });
    return json(res, 200, { success: true, data: o });
  }

  // Status
  const statusM = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/status$/);
  if (statusM && method === 'GET') {
    const o = OPP_MAP[statusM[1]];
    if (!o) return json(res, 404, { success: false, error: 'Opportunity not found' });
    return json(res, 200, { success: true, data: o });
  }

  // Fetch invoice
  const invoiceM = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/fetch-invoice$/);
  if (invoiceM && method === 'POST') {
    const o = OPP_MAP[invoiceM[1]];
    if (!o) return json(res, 404, { success: false, error: 'Opportunity not found' });
    if (!o.invoice) {
      o.invoice = {
        id: 'inv_' + invoiceM[1],
        netsuiteId: 'ns_inv_' + invoiceM[1].replace('demo_opp_', ''),
        opportunityId: o.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalAmount: o.amount,
        status: 'OPEN',
        fetchedAt: new Date().toISOString(),
        lineItems: [
          { description: o.name + ' — License Fee', quantity: 1, unitPrice: Math.round(o.amount * 0.8), amount: Math.round(o.amount * 0.8) },
          { description: 'Implementation & Support', quantity: 1, unitPrice: Math.round(o.amount * 0.2), amount: Math.round(o.amount * 0.2) },
        ],
      } as never;
      (o as { status: string }).status = 'INVOICE_FETCHED';
    }
    return json(res, 200, { success: true, data: o, message: 'Invoice fetched and stored' });
  }

  // Invite host
  const inviteM = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/invite-host$/);
  if (inviteM && method === 'POST') {
    const o = OPP_MAP[inviteM[1]];
    if (!o) return json(res, 404, { success: false, error: 'Opportunity not found' });
    if (!o.invoice) return json(res, 422, { success: false, error: 'Fetch invoice before inviting host' });
    const newAcctId = 'acct_demo_' + Date.now();
    const onboardingUrl = `/demo/onboarding?account=${newAcctId}&return_url=/opportunities/${inviteM[1]}`;
    (o as { status: string }).status = 'INVITE_SENT';
    (o as { stripeAccount: unknown }).stripeAccount = { id: 'sa_' + inviteM[1], stripeAccountId: newAcctId, onboardingStatus: 'PENDING', onboardingUrl, detailsSubmitted: false, chargesEnabled: false, createdAt: new Date().toISOString() };
    return json(res, 200, { success: true, data: { stripeAccountId: newAcctId, onboardingUrl }, message: 'Stripe account created and onboarding email sent' });
  }

  // Charge
  const chargeM = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/charge$/);
  if (chargeM && method === 'POST') {
    const o = OPP_MAP[chargeM[1]];
    if (!o) return json(res, 404, { success: false, error: 'Opportunity not found' });
    return json(res, 200, { success: true, data: { paymentIntentId: 'pi_demo_' + Date.now(), clientSecret: 'pi_demo_secret_' + Math.random().toString(36).slice(2), amount: o.invoice?.totalAmount ?? o.amount, status: 'requires_payment_method' } });
  }

  // Audit log
  const auditM = path.match(/^\/api\/audit\/(demo_opp_\w+)$/);
  if (auditM && method === 'GET') {
    const o = OPP_MAP[auditM[1]];
    if (!o) return json(res, 404, { success: false, error: 'Opportunity not found' });
    return json(res, 200, { success: true, data: o.auditLogs });
  }

  // Webhook / cron no-ops
  if (path === '/api/webhooks/stripe') return json(res, 200, { received: true });
  if (path.startsWith('/api/cron/')) return json(res, 200, { success: true, message: 'Demo mode: no-op' });

  return json(res, 404, { success: false, error: `Route not found: ${method} ${path}` });
}
