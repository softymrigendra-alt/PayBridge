import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { netsuiteService as _netsuiteReal } from '../services/netsuite';
import { netsuiteServiceMock } from '../services/netsuite.mock';
import { stripeService } from '../services/stripe';
import { emailService } from '../services/email';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const netsuiteService = process.env['NETSUITE_MOCK'] === 'true' ? netsuiteServiceMock : _netsuiteReal;

const router = Router();

// All opportunity routes require auth
router.use(authenticate);

/**
 * GET /api/opportunities
 * List all opportunities with status
 */
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string ?? '1');
  const limit = Math.min(parseInt(req.query['limit'] as string ?? '20'), 100);
  const status = req.query['status'] as string | undefined;
  const search = req.query['search'] as string | undefined;

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as never } },
            { accountName: { contains: search, mode: 'insensitive' as never } },
            { hostEmail: { contains: search, mode: 'insensitive' as never } },
          ],
        }
      : {}),
  };

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: {
        invoice: { select: { id: true, netsuiteId: true, totalAmount: true, status: true, dueDate: true } },
        stripeAccount: { select: { id: true, onboardingStatus: true, chargesEnabled: true } },
        payments: { select: { id: true, status: true, amount: true, paidAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ]);

  res.json({
    success: true,
    data: opportunities,
    total,
    page,
    limit,
  });
});

/**
 * GET /api/opportunities/:id
 * Get single opportunity with full relations
 */
router.get('/:id', async (req: Request, res: Response) => {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: req.params['id'] },
    include: {
      invoice: true,
      stripeAccount: true,
      payments: { orderBy: { createdAt: 'desc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });

  if (!opportunity) throw new AppError('Opportunity not found', 404);

  res.json({ success: true, data: opportunity });
});

/**
 * POST /api/opportunities/:id/fetch-invoice
 * Fetch NetSuite invoice for the opportunity
 */
router.post('/:id/fetch-invoice', async (req: Request, res: Response) => {
  const { id } = req.params;

  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity) throw new AppError('Opportunity not found', 404);

  logger.info(`Fetching NetSuite invoice for opportunity ${id}`);
  const success = await netsuiteService.matchAndStoreInvoice(id);

  if (!success) {
    res.status(422).json({
      success: false,
      error: 'No matching NetSuite invoice found for this opportunity',
    });
    return;
  }

  const updated = await prisma.opportunity.findUnique({
    where: { id },
    include: { invoice: true },
  });

  res.json({
    success: true,
    data: updated,
    message: 'Invoice fetched and stored',
  });
});

/**
 * POST /api/opportunities/:id/invite-host
 * Create Stripe Connected Account + send onboarding email
 */
router.post('/:id/invite-host', async (req: Request, res: Response) => {
  const { id } = req.params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { invoice: true, stripeAccount: true },
  });

  if (!opportunity) throw new AppError('Opportunity not found', 404);
  if (!opportunity.invoice) throw new AppError('Fetch invoice before inviting host', 422);

  const result = await stripeService.createConnectedAccount(
    id,
    opportunity.hostEmail,
    opportunity.accountName,
  );

  // Send onboarding email
  try {
    await emailService.sendOnboardingInvite({
      accountName: opportunity.accountName,
      hostEmail: opportunity.hostEmail,
      onboardingUrl: result.onboardingUrl,
      invoiceAmount: opportunity.invoice.totalAmount,
      dueDate: opportunity.invoice.dueDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
      opportunityName: opportunity.name,
    });

    await prisma.auditLog.create({
      data: {
        opportunityId: id,
        event: 'HOST_INVITED',
        metadata: { email: opportunity.hostEmail, stripeAccountId: result.accountId },
        level: 'info',
      },
    });
  } catch (emailError) {
    logger.error('Failed to send onboarding email', { error: emailError });
    // Don't fail the whole request — Stripe account was created
    await prisma.auditLog.create({
      data: {
        opportunityId: id,
        event: 'EMAIL_SEND_FAILED',
        metadata: { error: emailError instanceof Error ? emailError.message : String(emailError) },
        level: 'warn',
      },
    });
  }

  res.json({
    success: true,
    data: { stripeAccountId: result.accountId, onboardingUrl: result.onboardingUrl },
    message: 'Stripe account created and onboarding email sent',
  });
});

/**
 * GET /api/opportunities/:id/status
 * Poll registration + payment status
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      stripeAccount: true,
      invoice: { select: { status: true, totalAmount: true, dueDate: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!opportunity) throw new AppError('Opportunity not found', 404);

  // Refresh onboarding status from Stripe if pending
  if (opportunity.stripeAccount?.onboardingStatus === 'PENDING') {
    try {
      await stripeService.pollOnboardingStatus(id);
    } catch (err) {
      logger.warn(`Failed to poll onboarding status for ${id}`, { error: err });
    }
  }

  const fresh = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      stripeAccount: true,
      invoice: { select: { status: true, totalAmount: true, dueDate: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  res.json({ success: true, data: fresh });
});

/**
 * POST /api/opportunities/:id/charge
 * Create PaymentIntent and return client_secret for frontend confirmation
 */
router.post('/:id/charge', async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await stripeService.createPaymentIntent(id);

  res.json({
    success: true,
    data: result,
    message: 'PaymentIntent created',
  });
});

export default router;
