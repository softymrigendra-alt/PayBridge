import { onboardingStatusQueue } from './queue';
import { stripeService } from '../services/stripe';
import { prisma } from '../db/client';
import { OnboardingStatusJobData } from '../types';
import logger from '../utils/logger';

// Schedule: every 30 minutes
const CRON_SCHEDULE = '*/30 * * * *';

export function registerOnboardingStatusJob() {
  onboardingStatusQueue.process(async (job) => {
    const { opportunityId } = job.data as OnboardingStatusJobData;
    logger.info(`Onboarding status poll for opportunity ${opportunityId}`);

    const status = await stripeService.pollOnboardingStatus(opportunityId);
    return { opportunityId, status };
  });

  // Repeatable: poll all pending onboarding accounts every 30 mins
  onboardingStatusQueue.add(
    { opportunityId: '__batch__', stripeAccountId: '' },
    {
      repeat: { cron: CRON_SCHEDULE },
      jobId: 'onboarding-batch-poll',
    },
  );

  // Override process for the batch job type
  onboardingStatusQueue.on('active', async (job) => {
    if (job.data.opportunityId === '__batch__') {
      const pendingAccounts = await prisma.stripeAccount.findMany({
        where: { onboardingStatus: 'PENDING' },
        select: { opportunityId: true, stripeAccountId: true },
      });

      logger.info(`Batch onboarding poll: ${pendingAccounts.length} accounts to check`);

      for (const acct of pendingAccounts) {
        await onboardingStatusQueue.add({
          opportunityId: acct.opportunityId,
          stripeAccountId: acct.stripeAccountId,
        });
      }
    }
  });

  logger.info(`Onboarding status job scheduled: ${CRON_SCHEDULE}`);
}
