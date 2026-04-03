import { OpportunityStatus } from '../types';

const config: Record<OpportunityStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pending', classes: 'bg-gray-100 text-gray-700' },
  INVOICE_FETCHED: { label: 'Invoice Fetched', classes: 'bg-blue-100 text-blue-700' },
  INVITE_SENT: { label: 'Invite Sent', classes: 'bg-yellow-100 text-yellow-700' },
  ONBOARDING_COMPLETE: { label: 'Onboarding Done', classes: 'bg-teal-100 text-teal-700' },
  PAYMENT_PENDING: { label: 'Payment Pending', classes: 'bg-purple-100 text-purple-700' },
  PAYMENT_SUCCEEDED: { label: 'Paid', classes: 'bg-green-100 text-green-700' },
  PAYMENT_FAILED: { label: 'Payment Failed', classes: 'bg-red-100 text-red-700' },
  ERROR: { label: 'Error', classes: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  const { label, classes } = config[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' };
  return <span className={`badge ${classes}`}>{label}</span>;
}
