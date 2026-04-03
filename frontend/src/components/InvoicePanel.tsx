import { Invoice } from '../types';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  VOID: 'bg-gray-100 text-gray-500',
};

export function InvoicePanel({ invoice }: { invoice: Invoice }) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">NetSuite ID</p>
          <p className="font-mono text-sm font-semibold text-gray-800">{invoice.netsuiteId}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Due Date</p>
          <p className="text-sm font-semibold text-gray-800">
            {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
          </p>
        </div>
        <span className={`badge ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {invoice.status}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
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
              <td colSpan={3} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt.format(invoice.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
