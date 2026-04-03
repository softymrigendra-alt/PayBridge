import { invoiceMatchQueue } from './queue';
import { netsuiteService } from '../services/netsuite';
import { InvoiceMatchJobData } from '../types';
import logger from '../utils/logger';

export function registerInvoiceMatchJob() {
  invoiceMatchQueue.process(async (job) => {
    const { opportunityId } = job.data as InvoiceMatchJobData;
    logger.info(`Invoice match job started for opportunity ${opportunityId}`);

    const matched = await netsuiteService.matchAndStoreInvoice(opportunityId);

    if (!matched) {
      logger.warn(`No invoice match for opportunity ${opportunityId} — will not retry automatically`);
    }

    return { opportunityId, matched };
  });

  logger.info('Invoice match job processor registered');
}
