/**
 * Demo mode middleware.
 * When DEMO_MODE=true, intercepts all /api routes and returns realistic
 * mock data so the app looks and feels fully functional without any
 * external service credentials.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const DEMO_JWT_SECRET = 'demo-secret-key-minimum-32-characters-ok';
const DEMO_USER = { id: 'demo_user_1', email: 'admin@arservice.com', name: 'Admin User', role: 'admin' };

// ── Static demo data ──────────────────────────────────────────────────────────

const OPP1 = {
  id: 'demo_opp_001', salesforceId: 'sf_001', name: 'TechCorp Annual License Q1',
  accountName: 'TechCorp Inc.', accountId: 'sf_acc_001', hostEmail: 'billing@techcorp.com',
  amount: 48000, stage: 'Closed Won', closeDate: '2026-01-15T00:00:00.000Z',
  status: 'PAYMENT_SUCCEEDED', errorMessage: null,
  createdAt: '2026-01-15T10:00:00.000Z', updatedAt: '2026-01-20T10:00:00.000Z',
  invoice: {
    id: 'demo_inv_001', netsuiteId: 'ns_inv_001', opportunityId: 'demo_opp_001',
    dueDate: '2026-02-15T00:00:00.000Z', totalAmount: 48000, status: 'PAID', fetchedAt: '2026-01-16T10:00:00.000Z',
    lineItems: [
      { description: 'Enterprise License — Annual', quantity: 1, unitPrice: 40000, amount: 40000 },
      { description: 'Priority Support Package', quantity: 1, unitPrice: 8000, amount: 8000 },
    ],
  },
  stripeAccount: {
    id: 'demo_sa_001', stripeAccountId: 'acct_demo_techcorp', onboardingStatus: 'COMPLETE',
    onboardingUrl: null, detailsSubmitted: true, chargesEnabled: true, createdAt: '2026-01-17T10:00:00.000Z',
  },
  payments: [
    { id: 'demo_pr_001', stripePaymentIntentId: 'pi_demo_techcorp_001', amount: 48000,
      currency: 'usd', status: 'SUCCEEDED', retryCount: 0, paidAt: '2026-01-20T10:00:00.000Z',
      failureMessage: null, createdAt: '2026-01-20T10:00:00.000Z' },
  ],
  auditLogs: [
    { id: 'al1', opportunityId: 'demo_opp_001', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-15T10:00:00.000Z' },
    { id: 'al2', opportunityId: 'demo_opp_001', event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_001', totalAmount: 48000 }, level: 'info', createdAt: '2026-01-16T10:00:00.000Z' },
    { id: 'al3', opportunityId: 'demo_opp_001', event: 'STRIPE_ACCOUNT_CREATED', metadata: { stripeAccountId: 'acct_demo_techcorp' }, level: 'info', createdAt: '2026-01-17T10:00:00.000Z' },
    { id: 'al4', opportunityId: 'demo_opp_001', event: 'HOST_INVITED', metadata: { email: 'billing@techcorp.com' }, level: 'info', createdAt: '2026-01-17T10:00:00.000Z' },
    { id: 'al5', opportunityId: 'demo_opp_001', event: 'ONBOARDING_COMPLETE', metadata: { stripeAccountId: 'acct_demo_techcorp' }, level: 'info', createdAt: '2026-01-18T10:00:00.000Z' },
    { id: 'al6', opportunityId: 'demo_opp_001', event: 'PAYMENT_SUCCEEDED', metadata: { amount: 48000, paymentIntentId: 'pi_demo_techcorp_001' }, level: 'info', createdAt: '2026-01-20T10:00:00.000Z' },
  ],
};

const OPP2 = {
  id: 'demo_opp_002', salesforceId: 'sf_002', name: 'StartupXYZ Platform Deal',
  accountName: 'StartupXYZ LLC', accountId: 'sf_acc_002', hostEmail: 'finance@startupxyz.io',
  amount: 15000, stage: 'Closed Won', closeDate: '2026-01-22T00:00:00.000Z',
  status: 'INVITE_SENT', errorMessage: null,
  createdAt: '2026-01-22T10:00:00.000Z', updatedAt: '2026-01-25T10:00:00.000Z',
  invoice: {
    id: 'demo_inv_002', netsuiteId: 'ns_inv_002', opportunityId: 'demo_opp_002',
    dueDate: '2026-02-28T00:00:00.000Z', totalAmount: 15000, status: 'OPEN', fetchedAt: '2026-01-23T10:00:00.000Z',
    lineItems: [
      { description: 'Platform Access — 12 months', quantity: 1, unitPrice: 12000, amount: 12000 },
      { description: 'Onboarding & Setup', quantity: 1, unitPrice: 3000, amount: 3000 },
    ],
  },
  stripeAccount: {
    id: 'demo_sa_002', stripeAccountId: 'acct_demo_startup', onboardingStatus: 'PENDING',
    onboardingUrl: 'https://connect.stripe.com/express/onboarding/demo_link', detailsSubmitted: false, chargesEnabled: false, createdAt: '2026-01-24T10:00:00.000Z',
  },
  payments: [],
  auditLogs: [
    { id: 'al7', opportunityId: 'demo_opp_002', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-22T10:00:00.000Z' },
    { id: 'al8', opportunityId: 'demo_opp_002', event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_002' }, level: 'info', createdAt: '2026-01-23T10:00:00.000Z' },
    { id: 'al9', opportunityId: 'demo_opp_002', event: 'HOST_INVITED', metadata: { email: 'finance@startupxyz.io' }, level: 'info', createdAt: '2026-01-24T10:00:00.000Z' },
  ],
};

const OPP3 = {
  id: 'demo_opp_003', salesforceId: 'sf_003', name: 'MegaRetail Holiday Campaign',
  accountName: 'MegaRetail Corp', accountId: 'sf_acc_003', hostEmail: 'ar@megaretail.com',
  amount: 125000, stage: 'Closed Won', closeDate: '2026-01-28T00:00:00.000Z',
  status: 'INVOICE_FETCHED', errorMessage: null,
  createdAt: '2026-01-28T10:00:00.000Z', updatedAt: '2026-01-29T10:00:00.000Z',
  invoice: {
    id: 'demo_inv_003', netsuiteId: 'ns_inv_003', opportunityId: 'demo_opp_003',
    dueDate: '2026-03-01T00:00:00.000Z', totalAmount: 125000, status: 'OPEN', fetchedAt: '2026-01-29T10:00:00.000Z',
    lineItems: [
      { description: 'Campaign Management Platform', quantity: 1, unitPrice: 85000, amount: 85000 },
      { description: 'Data Analytics Module', quantity: 1, unitPrice: 25000, amount: 25000 },
      { description: 'Dedicated Support (12mo)', quantity: 1, unitPrice: 15000, amount: 15000 },
    ],
  },
  stripeAccount: null,
  payments: [],
  auditLogs: [
    { id: 'al10', opportunityId: 'demo_opp_003', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-28T10:00:00.000Z' },
    { id: 'al11', opportunityId: 'demo_opp_003', event: 'INVOICE_FETCHED', metadata: { netsuiteId: 'ns_inv_003', totalAmount: 125000 }, level: 'info', createdAt: '2026-01-29T10:00:00.000Z' },
  ],
};

const OPP4 = {
  id: 'demo_opp_004', salesforceId: 'sf_004', name: 'FinServ Compliance Suite',
  accountName: 'FinServ Group', accountId: 'sf_acc_004', hostEmail: 'ops@finservgroup.com',
  amount: 92500, stage: 'Closed Won', closeDate: '2026-01-30T00:00:00.000Z',
  status: 'PENDING', errorMessage: null,
  createdAt: '2026-01-30T10:00:00.000Z', updatedAt: '2026-01-30T10:00:00.000Z',
  invoice: null, stripeAccount: null, payments: [],
  auditLogs: [
    { id: 'al12', opportunityId: 'demo_opp_004', event: 'OPPORTUNITY_SYNCED', metadata: { source: 'salesforce' }, level: 'info', createdAt: '2026-01-30T10:00:00.000Z' },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OPPORTUNITIES: any[] = [OPP1, OPP2, OPP3, OPP4];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OPP_MAP: Record<string, any> = {
  'demo_opp_001': OPP1, 'demo_opp_002': OPP2, 'demo_opp_003': OPP3, 'demo_opp_004': OPP4,
};

// ── Route handler ─────────────────────────────────────────────────────────────

function makeToken() {
  return jwt.sign({ userId: DEMO_USER.id, email: DEMO_USER.email, role: DEMO_USER.role }, DEMO_JWT_SECRET, { expiresIn: '24h' });
}

function verifyDemoToken(req: Request): boolean {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  try {
    jwt.verify(header.split(' ')[1], DEMO_JWT_SECRET);
    return true;
  } catch { return false; }
}

export function demoMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const method = req.method;

  // Health check — pass through
  if (path === '/health') return next();

  // ── Auth routes ─────────────────────────────────────────────────────────────
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = req.body as { email?: string; password?: string };
    if (email === 'admin@arservice.com' && password === 'admin123') {
      return res.json({ success: true, data: { token: makeToken(), user: DEMO_USER } });
    }
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  if (path === '/api/auth/me' && method === 'GET') {
    if (!verifyDemoToken(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    return res.json({ success: true, data: DEMO_USER });
  }

  // All other API routes require a valid demo token
  if (path.startsWith('/api/') && path !== '/api/webhooks/stripe') {
    if (!verifyDemoToken(req)) {
      return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    }
  }

  // ── Sync ───────────────────────────────────────────────────────────────────
  if (path === '/api/sync/salesforce' && method === 'POST') {
    return res.json({ success: true, data: { synced: 4, created: 0, updated: 4, errors: [] }, message: 'Sync complete: 0 created, 4 updated, 0 errors' });
  }

  // ── Opportunities list ────────────────────────────────────────────────────
  if (path === '/api/opportunities' && method === 'GET') {
    const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    let results = OPPORTUNITIES as typeof OPP1[];
    if (status) results = results.filter(o => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(o =>
        o.name.toLowerCase().includes(q) || o.accountName.toLowerCase().includes(q) || o.hostEmail.toLowerCase().includes(q)
      );
    }
    const p = parseInt(page), l = parseInt(limit);
    const paginated = results.slice((p - 1) * l, p * l);
    return res.json({ success: true, data: paginated, total: results.length, page: p, limit: l });
  }

  // ── Opportunity detail + status ───────────────────────────────────────────
  const detailMatch = path.match(/^\/api\/opportunities\/(demo_opp_\w+)$/);
  if (detailMatch && method === 'GET') {
    const opp = OPP_MAP[detailMatch[1]];
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    return res.json({ success: true, data: opp });
  }

  const statusMatch = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/status$/);
  if (statusMatch && method === 'GET') {
    const opp = OPP_MAP[statusMatch[1]];
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    return res.json({ success: true, data: opp });
  }

  // ── Fetch invoice ──────────────────────────────────────────────────────────
  const invoiceMatch = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/fetch-invoice$/);
  if (invoiceMatch && method === 'POST') {
    const opp = OPP_MAP[invoiceMatch[1]];
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    if (!opp.invoice) return res.status(422).json({ success: false, error: 'No matching NetSuite invoice found' });
    const updated = { ...opp, status: 'INVOICE_FETCHED' };
    return res.json({ success: true, data: updated, message: 'Invoice fetched and stored' });
  }

  // ── Invite host ────────────────────────────────────────────────────────────
  const inviteMatch = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/invite-host$/);
  if (inviteMatch && method === 'POST') {
    const opp = OPP_MAP[inviteMatch[1]];
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    if (!opp.invoice) return res.status(422).json({ success: false, error: 'Fetch invoice before inviting host' });
    return res.json({
      success: true,
      data: { stripeAccountId: 'acct_demo_new', onboardingUrl: 'https://connect.stripe.com/express/onboarding/demo_new_link' },
      message: 'Stripe account created and onboarding email sent',
    });
  }

  // ── Charge ────────────────────────────────────────────────────────────────
  const chargeMatch = path.match(/^\/api\/opportunities\/(demo_opp_\w+)\/charge$/);
  if (chargeMatch && method === 'POST') {
    const opp = OPP_MAP[chargeMatch[1]];
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    return res.json({
      success: true,
      data: {
        paymentIntentId: 'pi_demo_' + Date.now(),
        clientSecret: 'pi_demo_secret_' + Math.random().toString(36).slice(2),
        amount: opp.invoice?.totalAmount ?? opp.amount,
        status: 'requires_payment_method',
      },
    });
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  const auditMatch = path.match(/^\/api\/audit\/(demo_opp_\w+)$/);
  if (auditMatch && method === 'GET') {
    const opp = OPP_MAP[auditMatch[1]];
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    return res.json({ success: true, data: opp.auditLogs });
  }

  // ── Webhook (no-op in demo) ───────────────────────────────────────────────
  if (path === '/api/webhooks/stripe') {
    return res.json({ received: true });
  }

  // ── Cron (no-op in demo) ──────────────────────────────────────────────────
  if (path.startsWith('/api/cron/')) {
    return res.json({ success: true, message: 'Demo mode: cron no-op' });
  }

  next();
}
