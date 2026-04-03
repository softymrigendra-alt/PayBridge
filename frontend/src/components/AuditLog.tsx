import { AuditLog as AuditLogType } from '../types';
import { format } from 'date-fns';

const levelColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warn: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const eventIcons: Record<string, string> = {
  OPPORTUNITY_SYNCED: '🔄',
  INVOICE_FETCHED: '📄',
  INVOICE_NOT_FOUND: '🔍',
  INVOICE_FETCH_FAILED: '❌',
  STRIPE_ACCOUNT_CREATED: '🏦',
  HOST_INVITED: '📧',
  EMAIL_SEND_FAILED: '⚠️',
  ONBOARDING_COMPLETE: '✅',
  ONBOARDING_COMPLETE_WEBHOOK: '✅',
  PAYMENT_INTENT_CREATED: '💳',
  PAYMENT_SUCCEEDED: '💰',
  PAYMENT_FAILED: '❌',
  PAYMENT_MAX_RETRIES_REACHED: '🛑',
};

export function AuditLogPanel({ logs }: { logs: AuditLogType[] }) {
  if (logs.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No audit events yet</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-lg leading-none mt-0.5">{eventIcons[log.event] ?? '📋'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{log.event.replace(/_/g, ' ')}</span>
              <span className={`badge text-xs ${levelColors[log.level] ?? 'bg-gray-100 text-gray-600'}`}>
                {log.level}
              </span>
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
