import { AuditLog as AuditLogType } from '../types';
import { format } from 'date-fns';
import { Tooltip } from './Tooltip';

const levelColors: Record<string, string> = {
  info:  'bg-blue-100 text-blue-700',
  warn:  'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const levelTooltips: Record<string, string> = {
  info:  'Informational — step completed successfully',
  warn:  'Warning — completed with a non-critical issue',
  error: 'Error — step failed and may need attention',
};

const eventIcons: Record<string, string> = {
  OPPORTUNITY_SYNCED:          '🔄',
  INVOICE_FETCHED:             '📄',
  INVOICE_NOT_FOUND:           '🔍',
  INVOICE_FETCH_FAILED:        '❌',
  STRIPE_ACCOUNT_CREATED:      '🏦',
  HOST_INVITED:                '📧',
  EMAIL_SEND_FAILED:           '⚠️',
  ONBOARDING_COMPLETE:         '✅',
  ONBOARDING_COMPLETE_WEBHOOK: '✅',
  PAYMENT_INTENT_CREATED:      '💳',
  PAYMENT_SUCCEEDED:           '💰',
  PAYMENT_FAILED:              '❌',
  PAYMENT_MAX_RETRIES_REACHED: '🛑',
};

const eventTooltips: Record<string, string> = {
  OPPORTUNITY_SYNCED:          'Deal pulled from Salesforce CRM and added to the pipeline',
  INVOICE_FETCHED:             'Matching invoice retrieved from NetSuite ERP',
  INVOICE_NOT_FOUND:           'No invoice found in NetSuite for this account',
  INVOICE_FETCH_FAILED:        'Error while fetching invoice from NetSuite — check credentials',
  STRIPE_ACCOUNT_CREATED:      'Stripe Connect account created for the payment host',
  HOST_INVITED:                'Onboarding email with Stripe setup link dispatched to host',
  EMAIL_SEND_FAILED:           'Failed to deliver onboarding email — check SendGrid config',
  ONBOARDING_COMPLETE:         'Host submitted all required details and Stripe account is active',
  ONBOARDING_COMPLETE_WEBHOOK: 'Stripe webhook confirmed the host completed onboarding',
  PAYMENT_INTENT_CREATED:      'Stripe PaymentIntent initialised for the invoice amount',
  PAYMENT_SUCCEEDED:           'Payment collected and funds are in transit to the host',
  PAYMENT_FAILED:              'Payment attempt declined — retry will be scheduled automatically',
  PAYMENT_MAX_RETRIES_REACHED: 'All automatic retry attempts exhausted — manual action required',
};

export function AuditLogPanel({ logs }: { logs: AuditLogType[] }) {
  if (logs.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No audit events yet</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50 border border-gray-100">
          <Tooltip content={eventTooltips[log.event] ?? log.event} position="right">
            <span className="text-lg leading-none mt-0.5 cursor-default">{eventIcons[log.event] ?? '📋'}</span>
          </Tooltip>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip content={eventTooltips[log.event] ?? log.event}>
                <span className="text-sm font-semibold text-gray-800 cursor-default">
                  {log.event.replace(/_/g, ' ')}
                </span>
              </Tooltip>
              <Tooltip content={levelTooltips[log.level] ?? log.level}>
                <span className={`badge text-xs cursor-default ${levelColors[log.level] ?? 'bg-gray-100 text-gray-600'}`}>
                  {log.level}
                </span>
              </Tooltip>
            </div>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">
                {JSON.stringify(log.metadata)}
              </p>
            )}
          </div>
          <time className="text-xs text-gray-400 whitespace-nowrap">
            {format(new Date(log.createdAt), 'MMM d, HH:mm')}
          </time>
        </div>
      ))}
    </div>
  );
}
