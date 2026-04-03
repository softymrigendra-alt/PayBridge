export type OpportunityStatus =
  | 'PENDING'
  | 'INVOICE_FETCHED'
  | 'INVITE_SENT'
  | 'ONBOARDING_COMPLETE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'ERROR';

export type InvoiceStatus = 'OPEN' | 'PAID' | 'OVERDUE' | 'VOID';
export type OnboardingStatus = 'NOT_STARTED' | 'PENDING' | 'COMPLETE' | 'REJECTED';
export type PaymentStatus =
  | 'REQUIRES_PAYMENT_METHOD'
  | 'REQUIRES_CONFIRMATION'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  netsuiteId: string;
  opportunityId: string;
  dueDate: string;
  totalAmount: number;
  lineItems: LineItem[];
  status: InvoiceStatus;
  fetchedAt: string;
}

export interface StripeAccount {
  id: string;
  stripeAccountId: string;
  onboardingStatus: OnboardingStatus;
  onboardingUrl: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  retryCount: number;
  paidAt: string | null;
  failureMessage: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  opportunityId: string;
  event: string;
  metadata: Record<string, unknown> | null;
  level: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  salesforceId: string;
  name: string;
  accountName: string;
  accountId: string | null;
  hostEmail: string;
  amount: number;
  stage: string;
  closeDate: string | null;
  status: OpportunityStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  invoice?: Partial<Invoice> | null;
  stripeAccount?: Partial<StripeAccount> | null;
  payments?: Partial<PaymentRecord>[];
}

export interface OpportunityDetail extends Opportunity {
  invoice: Invoice | null;
  stripeAccount: StripeAccount | null;
  payments: PaymentRecord[];
  auditLogs: AuditLog[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
}

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  status: string;
}
