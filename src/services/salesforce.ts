import jsforce from 'jsforce';
import { env } from '../config/env';
import { prisma } from '../db/client';
import { withRetry } from '../utils/retry';
import logger from '../utils/logger';
import { SalesforceOpportunity, SalesforceSyncResult } from '../types';
import { OpportunityStatus } from '@prisma/client';

class SalesforceService {
  private conn: jsforce.Connection;
  private isConnected = false;

  constructor() {
    this.conn = new jsforce.Connection({
      oauth2: {
        clientId: env.SALESFORCE_CLIENT_ID,
        clientSecret: env.SALESFORCE_CLIENT_SECRET,
        redirectUri: env.SALESFORCE_REDIRECT_URI,
      },
      instanceUrl: env.SALESFORCE_INSTANCE_URL,
    });
  }

  async connect() {
    if (this.isConnected) return;

    await withRetry(
      async () => {
        if (env.SALESFORCE_USERNAME && env.SALESFORCE_PASSWORD) {
          const password = `${env.SALESFORCE_PASSWORD}${env.SALESFORCE_SECURITY_TOKEN ?? ''}`;
          await this.conn.login(env.SALESFORCE_USERNAME, password);
          this.isConnected = true;
          logger.info('Salesforce connected via username/password');
        } else {
          throw new Error(
            'Salesforce credentials not configured. Set SALESFORCE_USERNAME, SALESFORCE_PASSWORD, and SALESFORCE_SECURITY_TOKEN.',
          );
        }
      },
      { attempts: 3, delay: 2000 },
    );
  }

  async fetchClosedWonOpportunities(since?: Date): Promise<SalesforceOpportunity[]> {
    await this.connect();

    const sinceClause = since
      ? ` AND CloseDate >= ${since.toISOString().split('T')[0]}`
      : '';

    const soql = `
      SELECT
        Id, Name, Amount, AccountId,
        Account.BillingEmail, Account.Name,
        CloseDate, StageName
      FROM Opportunity
      WHERE StageName = 'Closed Won'
        AND Amount > 0
        ${sinceClause}
      ORDER BY CloseDate DESC
      LIMIT 200
    `;

    return withRetry(
      async () => {
        const result = await this.conn.query<SalesforceOpportunity>(soql);
        logger.info(`Fetched ${result.records.length} Salesforce opportunities`);
        return result.records;
      },
      { attempts: 3, delay: 2000 },
    );
  }

  async syncOpportunities(since?: Date): Promise<SalesforceSyncResult> {
    const result: SalesforceSyncResult = { synced: 0, created: 0, updated: 0, errors: [] };

    let opportunities: SalesforceOpportunity[];
    try {
      opportunities = await this.fetchClosedWonOpportunities(since);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to fetch Salesforce opportunities', { error: msg });
      throw new Error(`Salesforce sync failed: ${msg}`);
    }

    for (const sfOpp of opportunities) {
      try {
        const hostEmail = sfOpp.Account?.BillingEmail ?? '';
        const accountName = sfOpp.Account?.Name ?? 'Unknown Account';

        const existing = await prisma.opportunity.findUnique({
          where: { salesforceId: sfOpp.Id },
        });

        if (existing) {
          await prisma.opportunity.update({
            where: { salesforceId: sfOpp.Id },
            data: {
              name: sfOpp.Name,
              accountName,
              hostEmail,
              amount: sfOpp.Amount,
              stage: sfOpp.StageName,
              closeDate: sfOpp.CloseDate ? new Date(sfOpp.CloseDate) : null,
            },
          });
          result.updated++;
        } else {
          const created = await prisma.opportunity.create({
            data: {
              salesforceId: sfOpp.Id,
              name: sfOpp.Name,
              accountName,
              accountId: sfOpp.AccountId,
              hostEmail,
              amount: sfOpp.Amount,
              stage: sfOpp.StageName,
              closeDate: sfOpp.CloseDate ? new Date(sfOpp.CloseDate) : null,
              status: OpportunityStatus.PENDING,
            },
          });

          await prisma.auditLog.create({
            data: {
              opportunityId: created.id,
              event: 'OPPORTUNITY_SYNCED',
              metadata: { salesforceId: sfOpp.Id, source: 'salesforce_sync' },
              level: 'info',
            },
          });

          result.created++;
        }

        result.synced++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to upsert opportunity ${sfOpp.Id}`, { error: msg });
        result.errors.push(`${sfOpp.Id}: ${msg}`);
      }
    }

    logger.info('Salesforce sync complete', result);
    return result;
  }

  getOAuthAuthorizationUrl(): string {
    return this.conn.oauth2.getAuthorizationUrl({ scope: 'api refresh_token' });
  }

  async handleOAuthCallback(code: string) {
    await this.conn.authorize(code);
    this.isConnected = true;
    logger.info('Salesforce OAuth callback handled');
    return {
      accessToken: this.conn.accessToken,
      refreshToken: this.conn.refreshToken,
      instanceUrl: this.conn.instanceUrl,
    };
  }
}

export const salesforceService = new SalesforceService();
