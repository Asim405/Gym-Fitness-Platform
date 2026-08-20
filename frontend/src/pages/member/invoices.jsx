import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';
import { CreditCardIcon, CurrencyRupeeIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

function MemberInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/invoices')
      .then((res) => setInvoices(res.data.data || []))
      .catch(() => setError('Unable to load your invoices.'));
  }, []);

  const total = invoices
    .filter((invoice) => invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

  const getStatusBadge = (status) => {
    const config = {
      paid: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300/70', icon: CheckCircleIcon },
      pending: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-300/70', icon: ClockIcon },
      overdue: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-300/70', icon: XCircleIcon },
      cancelled: { border: 'border-slate-500/20', bg: 'bg-slate-500/10', text: 'text-slate-400/70', icon: XCircleIcon },
    };
    const { border, bg, text, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border ${border} ${bg} px-2.5 py-0.5 text-xs font-medium ${text}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <DashboardShell title="Invoices" subtitle="Review outstanding invoices and payment status">
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-emerald-400/60" />
              <h2 className="text-base font-light tracking-tight text-white/90">Invoice history</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-light text-emerald-300/70">
              <CurrencyRupeeIcon className="h-4 w-4" />
              Total: Rs. {total.toFixed(2)}
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="mt-6 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-8 text-center">
              <div className="flex justify-center">
                <svg className="h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-3 text-sm text-slate-400">No invoices found yet.</p>
              <p className="text-xs text-slate-500">Invoices will appear here once you have membership payments.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              {/* Mobile card view */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-lg border border-white/5 bg-[#0c0f12]/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light text-white/80">{invoice.invoice_number}</span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-light text-white/80">Rs. {Number(invoice.amount).toFixed(2)}</span>
                      <span className="text-slate-500">Due date</span>
                      <span className="text-slate-300">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</span>
                      <span className="text-slate-500">Membership</span>
                      <span className="text-slate-300">{invoice.membership_name || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <table className="hidden min-w-full text-left text-sm sm:table">
                <thead className="border-b border-white/5 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Invoice</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Amount</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Due date</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Status</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Membership</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-light text-white/80">{invoice.invoice_number}</td>
                      <td className="px-4 py-3 text-slate-300">Rs. {Number(invoice.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                      <td className="px-4 py-3 text-slate-400">{invoice.membership_name || '-'}</td>
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
    <ProtectedRoute allowedRoles={['member']}>
      <MemberInvoices />
    </ProtectedRoute>
  );
}