import { registerSalesforceSyncJob } from './salesforceSyncJob';
import { registerInvoiceMatchJob } from './invoiceMatchJob';
import { registerOnboardingStatusJob } from './onboardingStatusJob';
import { registerRetryPaymentJob } from './retryPaymentJob';
import { salesforceSyncQueue, invoiceMatchQueue, onboardingStatusQueue, retryPaymentQueue } from './queue';
import logger from '../utils/logger';

const isServerless = Boolean(process.env['VERCEL'] || process.env['AWS_LAMBDA_FUNCTION_NAME']);

export function startJobs() {
  if (isServerless) {
    logger.info('Serverless environment detected — Bull queues disabled. Using Vercel Cron instead.');
    return;
  }
  try {
    registerSalesforceSyncJob();
    registerInvoiceMatchJob();
    registerOnboardingStatusJob();
    registerRetryPaymentJob();
    logger.info('All background jobs started');
  } catch (error) {
    logger.error('Failed to start background jobs', { error });
  }
}

export async function stopJobs() {
  if (isServerless) return;
  await Promise.all([
    salesforceSyncQueue.close(),
    invoiceMatchQueue.close(),
    onboardingStatusQueue.close(),
    retryPaymentQueue.close(),
  ]);
  logger.info('All background jobs stopped');
}
