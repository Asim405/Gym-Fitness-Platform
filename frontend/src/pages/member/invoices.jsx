import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

function MemberInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/payments')
      .then((res) => setInvoices(res.data.data || []))
      .catch(() => setError('Unable to load your payment history.'));
  }, []);

  const total = invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

  return (
    <DashboardShell title="Invoices" subtitle="Review your payment history and receipts">
      <div className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
              <p className="text-sm text-slate-500">Your invoices are shown with amount, method, and date.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800">
              Total paid: ${total.toFixed(2)}
            </div>
          </div>
          {invoices.length === 0 ? (
            <p className="text-slate-500">No payments found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800">{new Date(invoice.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-800">${Number(invoice.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{invoice.payment_method}</td>
                      <td className="px-4 py-3 text-slate-600">{invoice.reference || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{invoice.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default function MemberInvoicesPage() {
  return (
    <ProtectedRoute allowedRoles={['member', 'admin']}>
      <MemberInvoices />
    </ProtectedRoute>
  );
}
