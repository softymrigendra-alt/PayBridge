/**
 * Drop-in Salesforce mock — returns realistic seeded data.
 * Used when SALESFORCE_MOCK=true.
 */
import { prisma } from '../db/client';
import logger from '../utils/logger';
import { SalesforceSyncResult } from '../types';
import { OpportunityStatus } from '@prisma/client';

const MOCK_OPPORTUNITIES = [
  {
    salesforceId: 'sf_mock_001',
    name: 'Acme Corp Enterprise License',
    accountName: 'Acme Corporation',
    accountId: 'sf_acc_mock_001',
    hostEmail: 'billing@acmecorp.com',
    amount: 72000,
    stage: 'Closed Won',
    closeDate: new Date('2026-01-10'),
  },
  {
    salesforceId: 'sf_mock_002',
    name: 'GlobalTech SaaS Platform Deal',
    accountName: 'GlobalTech Inc.',
    accountId: 'sf_acc_mock_002',
    hostEmail: 'finance@globaltech.io',
    amount: 38500,
    stage: 'Closed Won',
    closeDate: new Date('2026-01-18'),
  },
  {
    salesforceId: 'sf_mock_003',
    name: 'RetailChain Holiday Campaign',
    accountName: 'RetailChain LLC',
    accountId: 'sf_acc_mock_003',
    hostEmail: 'ar@retailchain.com',
    amount: 215000,
    stage: 'Closed Won',
    closeDate: new Date('2026-01-25'),
  },
];

export const salesforceServiceMock = {
  async syncOpportunities(): Promise<SalesforceSyncResult> {
    const result: SalesforceSyncResult = { synced: 0, created: 0, updated: 0, errors: [] };

    for (const opp of MOCK_OPPORTUNITIES) {
      const existing = await prisma.opportunity.findUnique({
        where: { salesforceId: opp.salesforceId },
      });

      if (existing) {
        await prisma.opportunity.update({
          where: { salesforceId: opp.salesforceId },
          data: { name: opp.name, accountName: opp.accountName, amount: opp.amount },
        });
        result.updated++;
      } else {
        const created = await prisma.opportunity.create({
          data: { ...opp, status: OpportunityStatus.PENDING },
        });
        await prisma.auditLog.create({
          data: {
            opportunityId: created.id,
            event: 'OPPORTUNITY_SYNCED',
            metadata: { source: 'salesforce_mock', salesforceId: opp.salesforceId },
            level: 'info',
          },
        });
        result.created++;
      }
      result.synced++;
    }

    logger.info('[MOCK] Salesforce sync complete', result);
    return result;
  },

  getOAuthAuthorizationUrl(): string {
    return 'https://login.salesforce.com/mock-oauth';
  },
};
