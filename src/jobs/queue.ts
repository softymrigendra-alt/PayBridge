import Bull from 'bull';
import { env } from '../config/env';
import logger from '../utils/logger';
import {
  SalesforceSyncJobData,
  InvoiceMatchJobData,
  OnboardingStatusJobData,
  RetryPaymentJobData,
} from '../types';

const REDIS_URL = env.REDIS_URL;

const defaultJobOptions: Bull.JobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export const salesforceSyncQueue = new Bull<SalesforceSyncJobData>(
  'salesforce-sync',
  REDIS_URL,
  { defaultJobOptions },
);

export const invoiceMatchQueue = new Bull<InvoiceMatchJobData>(
  'invoice-match',
  REDIS_URL,
  { defaultJobOptions },
);

export const onboardingStatusQueue = new Bull<OnboardingStatusJobData>(
  'onboarding-status',
  REDIS_URL,
  { defaultJobOptions },
);

export const retryPaymentQueue = new Bull<RetryPaymentJobData>(
  'retry-payment',
  REDIS_URL,
  { defaultJobOptions },
);

// Log queue errors
[salesforceSyncQueue, invoiceMatchQueue, onboardingStatusQueue, retryPaymentQueue].forEach(
  (queue) => {
    queue.on('error', (err) => {
      logger.error(`Queue ${queue.name} error`, { error: err.message });
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} in ${queue.name} failed`, {
        error: err.message,
        data: job.data,
        attemptsMade: job.attemptsMade,
      });
    });

    queue.on('completed', (job) => {
      logger.debug(`Job ${job.id} in ${queue.name} completed`);
    });
  },
);
