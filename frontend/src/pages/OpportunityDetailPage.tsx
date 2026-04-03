import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { opportunitiesApi } from '../api/opportunities';
import { OpportunityDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PipelineStepper } from '../components/PipelineStepper';
import { InvoicePanel } from '../components/InvoicePanel';
import { PaymentPanel } from '../components/PaymentPanel';
import { AuditLogPanel } from '../components/AuditLog';
import { Spinner } from '../components/Spinner';
import { Tooltip } from '../components/Tooltip';
import { format } from 'date-fns';

type Tab = 'overview' | 'invoice' | 'payment' | 'audit';

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const fetchOpportunity = useCallback(async () => {
    if (!id) return;
    try {
      const data = await opportunitiesApi.get(id);
      setOpportunity(data);
    } catch {
      toast.error('Failed to load opportunity');
      navigate('/opportunities');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);

  const handleFetchInvoice = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await opportunitiesApi.fetchInvoice(id);
      setOpportunity(updated);
      toast.success('Invoice fetched successfully');
      setTab('invoice');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to fetch invoice';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteHost = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const result = await opportunitiesApi.inviteHost(id);
      if (result.data) {
        setOpportunity((prev) => prev ? {
          ...prev,
          status: 'INVITE_SENT',
          stripeAccount: {
            id: 'sa_new',
            stripeAccountId: result.data!.stripeAccountId,
            onboardingStatus: 'PENDING',
            onboardingUrl: result.data!.onboardingUrl,
            detailsSubmitted: false,
            chargesEnabled: false,
            createdAt: new Date().toISOString(),
          },
        } : prev);
      }
      toast.success('Onboarding invite sent to host');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to send invite';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!opportunity) return null;

  const tabs: { key: Tab; label: string; tooltip: string }[] = [
    { key: 'overview',  label: 'Overview',  tooltip: 'Salesforce deal details and Stripe account status' },
    { key: 'invoice',   label: 'Invoice',   tooltip: 'NetSuite invoice line items and payment due date' },
    { key: 'payment',   label: 'Payment',   tooltip: 'Charge the invoice amount via Stripe' },
    { key: 'audit',     label: 'Audit Log', tooltip: 'Full timestamped event history for this opportunity' },
  ];

  const canFetchInvoice = opportunity.status === 'PENDING';
  const canInviteHost = opportunity.status === 'INVOICE_FETCHED';
  const canCharge = opportunity.status === 'ONBOARDING_COMPLETE';

  const overviewDetails: { label: string; value: string; tooltip: string }[] = [
    { label: 'Salesforce ID', value: opportunity.salesforceId,   tooltip: 'Unique identifier for this deal in Salesforce CRM' },
    { label: 'Account',       value: opportunity.accountName,    tooltip: 'The company this deal belongs to' },
    { label: 'Host Email',    value: opportunity.hostEmail,      tooltip: 'Contact who will receive the Stripe onboarding invite' },
    { label: 'SF Stage',      value: opportunity.stage,          tooltip: 'Deal stage as recorded in Salesforce CRM' },
    { label: 'Close Date',    value: opportunity.closeDate ? format(new Date(opportunity.closeDate), 'MMM d, yyyy') : '—', tooltip: 'Date the deal was marked Closed Won in Salesforce' },
    { label: 'Amount',        value: fmt.format(opportunity.amount), tooltip: 'Invoice amount to be collected via Stripe' },
    { label: 'Created',       value: format(new Date(opportunity.createdAt), 'MMM d, yyyy HH:mm'), tooltip: 'Date this opportunity was added to PayBridge' },
  ];

  const stripeDetails: { label: string; value: string; tooltip: string }[] = opportunity.stripeAccount ? [
    { label: 'Account ID',        value: opportunity.stripeAccount.stripeAccountId,                  tooltip: 'Unique Stripe Connect account ID for this host' },
    { label: 'Onboarding',        value: opportunity.stripeAccount.onboardingStatus,                 tooltip: 'Status of the host\'s Stripe Connect account setup' },
    { label: 'Details Submitted', value: opportunity.stripeAccount.detailsSubmitted ? 'Yes' : 'No', tooltip: 'Whether the host has submitted business details to Stripe' },
    { label: 'Charges Enabled',   value: opportunity.stripeAccount.chargesEnabled ? 'Yes' : 'No',   tooltip: 'Whether this Stripe account can accept and process payments' },
  ] : [];

  return (
    <div className="p-8">
      {/* Back */}
      <button
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to opportunities
      </button>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{opportunity.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{opportunity.accountName} · {opportunity.hostEmail}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={opportunity.status} />
            <Tooltip content="Total invoice amount to be charged via Stripe" position="left">
              <span className="text-xl font-bold text-gray-900 cursor-default">{fmt.format(opportunity.amount)}</span>
            </Tooltip>
          </div>
        </div>

        {/* Pipeline stepper */}
        <div className="mt-6">
          <PipelineStepper status={opportunity.status} />
        </div>

        {/* Action bar */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
          {canFetchInvoice && (
            <Tooltip content="Pull the matching invoice from NetSuite ERP for this account">
              <button onClick={handleFetchInvoice} disabled={actionLoading} className="btn-primary">
                {actionLoading ? <Spinner size="sm" /> : null}
                Fetch Invoice
              </button>
            </Tooltip>
          )}
          {canInviteHost && (
            <Tooltip content="Create a Stripe Connect account and email the onboarding link to the host">
              <button onClick={handleInviteHost} disabled={actionLoading} className="btn-primary">
                {actionLoading ? <Spinner size="sm" /> : null}
                Invite Host
              </button>
            </Tooltip>
          )}
          {opportunity.stripeAccount?.onboardingStatus === 'PENDING' && (
            <Tooltip content="Open Stripe Express onboarding portal — host must complete before payment can be collected">
              <a
                href={opportunity.stripeAccount.onboardingUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                View Onboarding Link
              </a>
            </Tooltip>
          )}
          {canCharge && (
            <Tooltip content="Charge the invoice amount via Stripe PaymentIntent">
              <button onClick={() => setTab('payment')} className="btn-primary">
                Proceed to Payment
              </button>
            </Tooltip>
          )}
        </div>

        {opportunity.errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {opportunity.errorMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((t) => (
            <Tooltip key={t.key} content={t.tooltip} position="bottom">
              <button
                onClick={() => setTab(t.key)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t.key
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.key === 'audit' && opportunity.auditLogs.length > 0 && (
                  <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {opportunity.auditLogs.length}
                  </span>
                )}
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="p-6">
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Opportunity Details</h3>
                <dl className="space-y-2">
                  {overviewDetails.map(({ label, value, tooltip }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <Tooltip content={tooltip} position="right">
                        <dt className="text-gray-500 cursor-default">{label}</dt>
                      </Tooltip>
                      <dd className="font-medium text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stripe Account</h3>
                {opportunity.stripeAccount ? (
                  <dl className="space-y-2">
                    {stripeDetails.map(({ label, value, tooltip }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <Tooltip content={tooltip} position="right">
                          <dt className="text-gray-500 cursor-default">{label}</dt>
                        </Tooltip>
                        <dd className="font-medium text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-gray-400">No Stripe account yet</p>
                )}
              </div>
            </div>
          )}

          {tab === 'invoice' && (
            opportunity.invoice
              ? <InvoicePanel invoice={opportunity.invoice} />
              : <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-4">No invoice fetched yet</p>
                  {canFetchInvoice && (
                    <Tooltip content="Pull the matching invoice from NetSuite ERP for this account">
                      <button onClick={handleFetchInvoice} disabled={actionLoading} className="btn-primary">
                        {actionLoading ? <Spinner size="sm" /> : null}
                        Fetch Invoice from NetSuite
                      </button>
                    </Tooltip>
                  )}
                </div>
          )}

          {tab === 'payment' && (
            canCharge && opportunity.invoice
              ? <PaymentPanel
                  opportunityId={opportunity.id}
                  amount={opportunity.invoice.totalAmount}
                  onSuccess={fetchOpportunity}
                />
              : <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">
                    {opportunity.status === 'PAYMENT_SUCCEEDED'
                      ? '✓ Payment has been collected'
                      : 'Complete onboarding before charging'}
                  </p>
                  {opportunity.payments.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment History</h3>
                      {opportunity.payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm py-2 border-b border-gray-100">
                          <Tooltip content="Stripe PaymentIntent ID for this transaction" position="right">
                            <span className="font-mono text-xs text-gray-500 cursor-default">{p.stripePaymentIntentId}</span>
                          </Tooltip>
                          <Tooltip content={p.status === 'SUCCEEDED' ? 'Payment collected successfully' : 'Payment attempt failed'}>
                            <span className={`badge cursor-default ${p.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.status}
                            </span>
                          </Tooltip>
                          <span className="font-medium">{fmt.format(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
          )}

          {tab === 'audit' && (
            <AuditLogPanel logs={opportunity.auditLogs} />
          )}
        </div>
      </div>
    </div>
  );
}
