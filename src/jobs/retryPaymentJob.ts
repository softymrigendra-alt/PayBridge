import Stripe from 'stripe';
import { retryPaymentQueue } from './queue';
import { prisma } from '../db/client';
import { emailService } from '../services/email';
import { RetryPaymentJobData } from '../types';
import { env } from '../config/env';
import logger from '../utils/logger';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', typescript: true });

const MAX_RETRIES = 3;

export function registerRetryPaymentJob() {
  retryPaymentQueue.process(async (job) => {
    const { opportunityId, paymentRecordId, attempt } = job.data as RetryPaymentJobData;

    logger.info(`Retry payment job: attempt ${attempt}/${MAX_RETRIES} for record ${paymentRecordId}`);

    const record = await prisma.paymentRecord.findUnique({
      where: { id: paymentRecordId },
    });

    if (!record) throw new Error(`PaymentRecord ${paymentRecordId} not found`);
    if (record.status === 'SUCCEEDED') {
      logger.info(`Payment ${paymentRecordId} already succeeded, skipping retry`);
      return { skipped: true };
    }
    if (record.retryCount >= MAX_RETRIES) {
      logger.warn(`Max retries (${MAX_RETRIES}) reached for payment ${paymentRecordId}`);
      return { maxRetriesReached: true };
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`);

    try {
      const pi = await stripe.paymentIntents.confirm(record.stripePaymentIntentId);

      if (pi.status === 'succeeded') {
        await prisma.paymentRecord.update({
          where: { id: paymentRecordId },
          data: { status: 'SUCCEEDED', paidAt: new Date(), retryCount: { increment: 1 } },
        });
        await prisma.opportunity.update({
          where: { id: opportunityId },
          data: { status: 'PAYMENT_SUCCEEDED' },
        });

        await emailService.sendPaymentReceipt({
          accountName: opportunity.accountName,
          hostEmail: opportunity.hostEmail,
          opportunityName: opportunity.name,
          amount: record.amount,
          paymentIntentId: record.stripePaymentIntentId,
          paidAt: new Date(),
        });

        logger.info(`Retry payment succeeded for record ${paymentRecordId}`);
        return { succeeded: true };
      }
    } catch (error) {
      const newCount = record.retryCount + 1;
      const failureMessage = error instanceof Error ? error.message : String(error);

      await prisma.paymentRecord.update({
        where: { id: paymentRecordId },
        data: { retryCount: { increment: 1 }, failureMessage },
      });

      if (newCount >= MAX_RETRIES) {
        // Send failure alert
        await emailService.sendPaymentFailureAlert({
          accountName: opportunity.accountName,
          hostEmail: opportunity.hostEmail,
          opportunityName: opportunity.name,
          amount: record.amount,
          failureReason: failureMessage,
          retryCount: newCount,
          maxRetries: MAX_RETRIES,
        });

        await prisma.auditLog.create({
          data: {
            opportunityId,
            event: 'PAYMENT_MAX_RETRIES_REACHED',
            metadata: { paymentRecordId, attempts: newCount },
            level: 'error',
          },
        });
      } else {
        // Re-queue with exponential backoff
        const delay = Math.pow(2, newCount) * 60 * 1000; // 2m, 4m, 8m...
        await retryPaymentQueue.add(
          { opportunityId, paymentRecordId, attempt: newCount + 1 },
          { delay },
        );
        logger.info(`Retry scheduled in ${delay / 1000}s`, { attempt: newCount + 1 });
      }

      throw error;
    }

    return { result: 'unknown' };
  });

  logger.info('Retry payment job processor registered');
}
