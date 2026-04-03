import { Invoice } from '../types';
import { format } from 'date-fns';
import { Tooltip } from './Tooltip';

const statusColors: Record<string, string> = {
  OPEN:    'bg-blue-100 text-blue-700',
  PAID:    'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  VOID:    'bg-gray-100 text-gray-500',
};

const statusTooltips: Record<string, string> = {
  OPEN:    'Invoice is unpaid and within the due date',
  PAID:    'Payment has been collected for this invoice',
  OVERDUE: 'Invoice is past due and unpaid — action required',
  VOID:    'Invoice has been cancelled and is no longer valid',
};

export function InvoicePanel({ invoice }: { invoice: Invoice }) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Tooltip content="Unique identifier for this invoice in NetSuite ERP" position="bottom">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium cursor-default">NetSuite ID</p>
          </Tooltip>
          <p className="font-mono text-sm font-semibold text-gray-800">{invoice.netsuiteId}</p>
        </div>
        <div className="text-right">
          <Tooltip content="Date by which this invoice must be paid" position="bottom">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium cursor-default">Due Date</p>
          </Tooltip>
          <p className="text-sm font-semibold text-gray-800">
            {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
          </p>
        </div>
        <Tooltip content={statusTooltips[invoice.status] ?? invoice.status}>
          <span className={`badge ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-700'} cursor-default`}>
            {invoice.status}
          </span>
        </Tooltip>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                <Tooltip content="Number of units for this line item" position="top">
                  <span className="cursor-default">Qty</span>
                </Tooltip>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                <Tooltip content="Price per individual unit" position="top">
                  <span className="cursor-default">Unit Price</span>
                </Tooltip>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                <Tooltip content="Qty × Unit Price for this line" position="top">
                  <span className="cursor-default">Amount</span>
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {invoice.lineItems.map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-gray-800">{item.description}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{fmt.format(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt.format(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                <Tooltip content="Sum of all line item amounts — this is the amount that will be charged" position="top">
                  <span className="cursor-default">Total</span>
                </Tooltip>
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt.format(invoice.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
