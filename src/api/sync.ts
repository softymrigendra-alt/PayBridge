import { Router, Request, Response } from 'express';
import { salesforceService } from '../services/salesforce';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/sync/salesforce
 * Trigger Salesforce opportunity sync
 */
router.post('/salesforce', authenticate, async (req: Request, res: Response) => {
  const { since } = req.body as { since?: string };
  const sinceDate = since ? new Date(since) : undefined;

  logger.info('Manual Salesforce sync triggered', { triggeredBy: req.user?.email, since });

  const result = await salesforceService.syncOpportunities(sinceDate);

  res.json({
    success: true,
    data: result,
    message: `Sync complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`,
  });
});

export default router;
