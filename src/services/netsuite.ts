import axios, { AxiosInstance } from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../db/client';
import { withRetry } from '../utils/retry';
import logger from '../utils/logger';
import { NetSuiteInvoice, NetSuiteLineItem } from '../types';
import { InvoiceStatus, OpportunityStatus } from '@prisma/client';

interface NetSuiteInvoiceRecord {
  id: string;
  externalid?: string;
  tranid?: string;
  duedate?: string;
  status?: { id: string; refName: string };
  total?: number;
  item?: {
    items: Array<{
      description?: string;
      quantity?: number;
      rate?: number;
      amount?: number;
    }>;
  };
}

class NetSuiteService {
  private oauth: OAuth;
  private client: AxiosInstance;

  constructor() {
    this.oauth = new OAuth({
      consumer: {
        key: env.NETSUITE_CONSUMER_KEY,
        secret: env.NETSUITE_CONSUMER_SECRET,
      },
      signature_method: 'HMAC-SHA256',
      hash_function: (baseString: string, key: string) =>
        crypto.createHmac('sha256', key).update(baseString).digest('base64'),
    });

    this.client = axios.create({
      baseURL: env.NETSUITE_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    // Attach OAuth header to every request
    this.client.interceptors.request.use((config) => {
      const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
      const method = (config.method ?? 'GET').toUpperCase();

      const authHeader = this.oauth.toHeader(
        this.oauth.authorize(
          { url, method },
          { key: env.NETSUITE_TOKEN_KEY, secret: env.NETSUITE_TOKEN_SECRET },
        ),
      );

      config.headers['Authorization'] = authHeader['Authorization'];
      config.headers['prefer'] = 'transient';
      return config;
    });
  }

  private mapInvoiceStatus(nsStatus?: string): InvoiceStatus {
    if (!nsStatus) return InvoiceStatus.OPEN;
    const s = nsStatus.toLowerCase();
    if (s.includes('paid') || s.includes('closed')) return InvoiceStatus.PAID;
    if (s.includes('void')) return InvoiceStatus.VOID;
    if (s.includes('overdue')) return InvoiceStatus.OVERDUE;
    return InvoiceStatus.OPEN;
  }

  private parseLineItems(record: NetSuiteInvoiceRecord): NetSuiteLineItem[] {
    const items = record.item?.items ?? [];
    return items.map((item) => ({
      description: item.description ?? 'Service',
      quantity: item.quantity ?? 1,
      unitPrice: item.rate ?? 0,
      amount: item.amount ?? 0,
    }));
  }

  async fetchInvoiceByExternalId(externalId: string): Promise<NetSuiteInvoice | null> {
    return withRetry(
      async () => {
        const response = await this.client.get<{ items: NetSuiteInvoiceRecord[] }>(
          `/services/rest/record/v1/invoice`,
          { params: { q: `externalid IS ${externalId}`, limit: 1 } },
        );

        const records = response.data?.items ?? [];
        if (records.length === 0) return null;

        return this.mapRecord(records[0]);
      },
      { attempts: 3, delay: 2000 },
    );
  }

  async fetchInvoiceByName(name: string): Promise<NetSuiteInvoice | null> {
    return withRetry(
      async () => {
        const response = await this.client.get<{ items: NetSuiteInvoiceRecord[] }>(
          `/services/rest/record/v1/invoice`,
          { params: { q: `tranid CONTAIN ${encodeURIComponent(name)}`, limit: 1 } },
        );

        const records = response.data?.items ?? [];
        if (records.length === 0) return null;

        return this.mapRecord(records[0]);
      },
      { attempts: 3, delay: 2000 },
    );
  }

  async fetchInvoiceById(invoiceId: string): Promise<NetSuiteInvoice | null> {
    return withRetry(
      async () => {
        const response = await this.client.get<NetSuiteInvoiceRecord>(
          `/services/rest/record/v1/invoice/${invoiceId}`,
        );
        return this.mapRecord(response.data);
      },
      { attempts: 3, delay: 2000 },
    );
  }

  private mapRecord(record: NetSuiteInvoiceRecord): NetSuiteInvoice {
    return {
      invoiceId: record.id,
      externalId: record.externalid,
      dueDate: record.duedate ?? new Date().toISOString(),
      status: record.status?.refName ?? 'Open',
      lineItems: this.parseLineItems(record),
      totalAmount: record.total ?? 0,
    };
  }

  async matchAndStoreInvoice(opportunityId: string): Promise<boolean> {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`);

    // Try matching by salesforceId first, then by name
    let nsInvoice: NetSuiteInvoice | null = null;

    try {
      nsInvoice = await this.fetchInvoiceByExternalId(opportunity.salesforceId);
      if (!nsInvoice) {
        nsInvoice = await this.fetchInvoiceByName(opportunity.name);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`NetSuite invoice fetch failed for opportunity ${opportunityId}`, { error: msg });

      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: { status: OpportunityStatus.ERROR, errorMessage: `NetSuite: ${msg}` },
      });

      await prisma.auditLog.create({
        data: {
          opportunityId,
          event: 'INVOICE_FETCH_FAILED',
          metadata: { error: msg },
          level: 'error',
        },
      });

      return false;
    }

    if (!nsInvoice) {
      logger.warn(`No matching NetSuite invoice for opportunity ${opportunityId}`);
      await prisma.auditLog.create({
        data: {
          opportunityId,
          event: 'INVOICE_NOT_FOUND',
          metadata: { opportunityName: opportunity.name },
          level: 'warn',
        },
      });
      return false;
    }

    // Upsert invoice
    const existing = await prisma.invoice.findFirst({
      where: { opportunityId },
    });

    if (existing) {
      await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          netsuiteId: nsInvoice.invoiceId,
          dueDate: new Date(nsInvoice.dueDate),
          totalAmount: nsInvoice.totalAmount,
          lineItems: nsInvoice.lineItems as never,
          status: this.mapInvoiceStatus(nsInvoice.status),
        },
      });
    } else {
      await prisma.invoice.create({
        data: {
          netsuiteId: nsInvoice.invoiceId,
          opportunityId,
          dueDate: new Date(nsInvoice.dueDate),
          totalAmount: nsInvoice.totalAmount,
          lineItems: nsInvoice.lineItems as never,
          status: this.mapInvoiceStatus(nsInvoice.status),
        },
      });
    }

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: OpportunityStatus.INVOICE_FETCHED },
    });

    await prisma.auditLog.create({
      data: {
        opportunityId,
        event: 'INVOICE_FETCHED',
        metadata: { netsuiteId: nsInvoice.invoiceId, totalAmount: nsInvoice.totalAmount },
        level: 'info',
      },
    });

    logger.info(`Invoice stored for opportunity ${opportunityId}`, { netsuiteId: nsInvoice.invoiceId });
    return true;
  }
}

export const netsuiteService = new NetSuiteService();
