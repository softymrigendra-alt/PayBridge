/**
 * Drop-in mock for NetSuite service — use while waiting for real credentials.
 * Swap import in netsuite.ts or use via env flag.
 */
import { prisma } from '../db/client';
import logger from '../utils/logger';
import { InvoiceStatus, OpportunityStatus } from '@prisma/client';

export const netsuiteServiceMock = {
  async matchAndStoreInvoice(opportunityId: string): Promise<boolean> {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) return false;

    // Generate a plausible mock invoice
    const mockInvoiceId = `ns_mock_${opportunityId.slice(-6)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const existing = await prisma.invoice.findFirst({ where: { opportunityId } });

    if (existing) {
      logger.info(`[MOCK] Invoice already exists for ${opportunityId}`);
      return true;
    }

    await prisma.invoice.create({
      data: {
        netsuiteId: mockInvoiceId,
        opportunityId,
        dueDate,
        totalAmount: opportunity.amount,
        status: InvoiceStatus.OPEN,
        lineItems: [
          {
            description: `${opportunity.name} — Services`,
            quantity: 1,
            unitPrice: opportunity.amount * 0.8,
            amount: opportunity.amount * 0.8,
          },
          {
            description: 'Implementation & Support',
            quantity: 1,
            unitPrice: opportunity.amount * 0.2,
            amount: opportunity.amount * 0.2,
          },
        ],
      },
    });

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: OpportunityStatus.INVOICE_FETCHED },
    });

    await prisma.auditLog.create({
      data: {
        opportunityId,
        event: 'INVOICE_FETCHED',
        metadata: { netsuiteId: mockInvoiceId, mock: true },
        level: 'info',
      },
    });

    logger.info(`[MOCK] Invoice created for ${opportunityId}`, { mockInvoiceId });
    return true;
  },
};
