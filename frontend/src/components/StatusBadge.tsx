import { OpportunityStatus } from '../types';
import { Tooltip } from './Tooltip';

const config: Record<OpportunityStatus, { label: string; classes: string; tooltip: string }> = {
  PENDING:            { label: 'Pending',         classes: 'bg-gray-100 text-gray-700',   tooltip: 'Awaiting invoice fetch from NetSuite ERP' },
  INVOICE_FETCHED:    { label: 'Invoice Fetched', classes: 'bg-blue-100 text-blue-700',   tooltip: 'Invoice matched and stored from NetSuite ERP' },
  INVITE_SENT:        { label: 'Invite Sent',     classes: 'bg-yellow-100 text-yellow-700', tooltip: 'Stripe onboarding invite sent to the payment host' },
  ONBOARDING_COMPLETE:{ label: 'Onboarding Done', classes: 'bg-teal-100 text-teal-700',  tooltip: 'Host completed Stripe Connect account setup — ready to charge' },
  PAYMENT_PENDING:    { label: 'Payment Pending', classes: 'bg-purple-100 text-purple-700', tooltip: 'Payment intent created, awaiting card confirmation' },
  PAYMENT_SUCCEEDED:  { label: 'Paid',            classes: 'bg-green-100 text-green-700', tooltip: 'Payment collected successfully via Stripe' },
  PAYMENT_FAILED:     { label: 'Payment Failed',  classes: 'bg-red-100 text-red-700',    tooltip: 'Payment attempt failed — will retry automatically' },
  ERROR:              { label: 'Error',            classes: 'bg-red-100 text-red-700',    tooltip: 'An unexpected error occurred in the pipeline' },
};

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  const { label, classes, tooltip } = config[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700', tooltip: '' };
  return (
    <Tooltip content={tooltip}>
      <span className={`badge ${classes} cursor-default`}>{label}</span>
    </Tooltip>
  );
}
