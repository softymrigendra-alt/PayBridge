/**
 * Vercel Cron Job endpoints.
 * Called by Vercel's scheduler instead of Bull queues in serverless.
 * Secured with CRON_SECRET header.
 */
import { Router, Request, Response } from 'express';
import { salesforceService } from '../services/salesforce';
import { prisma } from '../db/client';
import { stripeService } from '../services/stripe';
import logger from '../utils/logger';

const router = Router();

function verifyCronSecret(req: Request, res: Response): boolean {
  const secret = process.env['CRON_SECRET'];
  if (!secret) return true; // not enforced in dev

  const provided = req.headers['authorization'];
  if (provided !== `Bearer ${secret}`) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

/**
 * GET /api/cron/salesforce-sync
 * Triggered every 6 hours by Vercel Cron.
 */
router.get('/salesforce-sync', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req, res)) return;

  logger.info('Cron: Salesforce sync triggered');
  try {
    const result = await salesforceService.syncOpportunities();
    res.json({ success: true, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Cron: Salesforce sync failed', { error: msg });
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/cron/onboarding-poll
 * Triggered every 30 mins by Vercel Cron.
 * Polls Stripe for all accounts with PENDING onboarding.
 */
router.get('/onboarding-poll', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req, res)) return;

  logger.info('Cron: Onboarding status poll triggered');
  const pendingAccounts = await prisma.stripeAccount.findMany({
    where: { onboardingStatus: 'PENDING' },
    select: { opportunityId: true },
  });

  const results: Array<{ opportunityId: string; status: string }> = [];
  for (const acct of pendingAccounts) {
    try {
      const status = await stripeService.pollOnboardingStatus(acct.opportunityId);
      results.push({ opportunityId: acct.opportunityId, status });
    } catch (err) {
      logger.warn(`Cron: Failed to poll ${acct.opportunityId}`, { err });
      results.push({ opportunityId: acct.opportunityId, status: 'error' });
    }
  }

  res.json({ success: true, polled: results.length, results });
});

export default router;
