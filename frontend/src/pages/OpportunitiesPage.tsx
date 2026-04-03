import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { opportunitiesApi, syncApi } from '../api/opportunities';
import { Opportunity, OpportunityStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { format } from 'date-fns';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INVOICE_FETCHED', label: 'Invoice Fetched' },
  { value: 'INVITE_SENT', label: 'Invite Sent' },
  { value: 'ONBOARDING_COMPLETE', label: 'Onboarding Done' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { value: 'PAYMENT_SUCCEEDED', label: 'Paid' },
  { value: 'PAYMENT_FAILED', label: 'Failed' },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const result = await opportunitiesApi.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setOpportunities((result.data as unknown as Opportunity[]) ?? []);
      setTotal(result.total);
    } catch {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncApi.salesforce();
      toast.success(result.message ?? 'Sync complete');
      fetchOpportunities();
    } catch {
      toast.error('Salesforce sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total opportunities</p>
        </div>
        <button onClick={handleSync} disabled={syncing} className="btn-primary">
          {syncing ? <Spinner size="sm" /> : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Sync Salesforce
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Opportunity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Host Email</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SF Stage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">AR Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Close Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center"><Spinner /></div>
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No opportunities found
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm">{opp.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{opp.salesforceId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{opp.accountName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{opp.hostEmail}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 text-sm">{fmt.format(opp.amount)}</td>
                    <td className="px-6 py-4">
                      <span className="badge bg-gray-100 text-gray-600 text-xs">{opp.stage}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={opp.status as OpportunityStatus} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {opp.closeDate ? format(new Date(opp.closeDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs px-3 py-1"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="btn-secondary text-xs px-3 py-1"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
