import { Router, Request, Response } from 'express';
import { stripeService } from '../services/stripe';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events.
 * Raw body capture is handled in app.ts before this route.
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(400).json({ success: false, error: 'Missing stripe-signature header' });
    return;
  }

  if (!req.rawBody) {
    res.status(400).json({ success: false, error: 'Raw body not available' });
    return;
  }

  try {
    await stripeService.handleWebhook(req.rawBody, signature as string);
    res.json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Stripe webhook processing failed', { error: msg });
    res.status(400).json({ success: false, error: msg });
  }
});

export default router;
