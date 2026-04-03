import { salesforceSyncQueue, invoiceMatchQueue } from './queue';
import { salesforceService } from '../services/salesforce';
import { prisma } from '../db/client';
import { SalesforceSyncJobData } from '../types';
import logger from '../utils/logger';

// Schedule: every 6 hours
const CRON_SCHEDULE = '0 */6 * * *';

export function registerSalesforceSyncJob() {
  salesforceSyncQueue.process(async (job) => {
    const { since, triggeredBy } = job.data as SalesforceSyncJobData;
    logger.info('Salesforce sync job started', { triggeredBy, since });

    const result = await salesforceService.syncOpportunities(
      since ? new Date(since) : undefined,
    );

    // Enqueue invoice match for newly created opportunities
    if (result.created > 0) {
      const newOpps = await prisma.opportunity.findMany({
        where: {
          status: 'PENDING',
          invoice: null,
        },
        select: { id: true },
        take: 50,
      });

      for (const opp of newOpps) {
        await invoiceMatchQueue.add(
          { opportunityId: opp.id },
          { delay: 5000 }, // 5s delay to let DB settle
        );
      }

      logger.info(`Enqueued ${newOpps.length} invoice match jobs`);
    }

    return result;
  });

  // Add repeatable job (idempotent — Bull won't add duplicates with same key)
  salesforceSyncQueue.add(
    { triggeredBy: 'scheduler' },
    {
      repeat: { cron: CRON_SCHEDULE },
      jobId: 'salesforce-sync-recurring',
    },
  );

  logger.info(`Salesforce sync job scheduled: ${CRON_SCHEDULE}`);
}
