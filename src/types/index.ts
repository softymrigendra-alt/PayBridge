import {
  Opportunity,
  Invoice,
  StripeAccount,
  PaymentRecord,
  AuditLog,
  OpportunityStatus,
  InvoiceStatus,
  OnboardingStatus,
  PaymentStatus,
} from '@prisma/client';

// ─── Re-exports ───────────────────────────────────────────────────────────────
export {
  OpportunityStatus,
  InvoiceStatus,
  OnboardingStatus,
  PaymentStatus,
};

// ─── Salesforce ───────────────────────────────────────────────────────────────
export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  Amount: number;
  AccountId: string;
  Account: { BillingEmail: string; Name: string };
  CloseDate: string;
  StageName: string;
}

export interface SalesforceSyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

// ─── NetSuite ─────────────────────────────────────────────────────────────────
export interface NetSuiteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface NetSuiteInvoice {
  invoiceId: string;
  externalId?: string;
  dueDate: string;
  status: string;
  lineItems: NetSuiteLineItem[];
  totalAmount: number;
}

// ─── Stripe ───────────────────────────────────────────────────────────────────
export interface StripeOnboardingResult {
  accountId: string;
  onboardingUrl: string;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  status: string;
}

// ─── API Response types ───────────────────────────────────────────────────────
export type OpportunityWithRelations = Opportunity & {
  invoice: Invoice | null;
  stripeAccount: StripeAccount | null;
  payments: PaymentRecord[];
  auditLogs?: AuditLog[];
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// ─── Job types ────────────────────────────────────────────────────────────────
export interface SalesforceSyncJobData {
  triggeredBy?: string;
  since?: string;
}

export interface InvoiceMatchJobData {
  opportunityId: string;
}

export interface OnboardingStatusJobData {
  opportunityId: string;
  stripeAccountId: string;
}

export interface RetryPaymentJobData {
  opportunityId: string;
  paymentRecordId: string;
  attempt: number;
}
