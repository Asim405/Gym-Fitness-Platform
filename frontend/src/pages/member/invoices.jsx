import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

function MemberInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/invoices').then((res) => setInvoices(res.data.data || [])).catch(() => setError('Unable to load your invoices.'));
  }, []);

  const total = invoices.filter((invoice) => invoice.status !== 'cancelled').reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  return <DashboardShell title="Invoices" subtitle="Review outstanding invoices and payment status">
    <div className="space-y-6">
      {error && <p className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</p>}
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-white">Invoice history</h2><p className="mt-1 text-sm text-slate-400">Invoices are issued by the gym; payment confirmation is recorded separately.</p></div><span className="rounded-full bg-slate-950 px-4 py-2 text-sm text-slate-200">Invoice total: Rs. {total.toFixed(2)}</span></div>
        {invoices.length === 0 ? <p className="mt-6 text-slate-400">No invoices found yet.</p> : <div className="mt-6 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-800 text-slate-500"><tr><th className="p-3">Invoice</th><th className="p-3">Amount</th><th className="p-3">Due date</th><th className="p-3">Status</th><th className="p-3">Membership</th></tr></thead><tbody className="divide-y divide-slate-800">{invoices.map((invoice) => <tr key={invoice.id}><td className="p-3 text-white">{invoice.invoice_number}</td><td className="p-3 text-slate-300">Rs. {Number(invoice.amount).toFixed(2)}</td><td className="p-3 text-slate-400">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</td><td className="p-3 capitalize text-slate-400">{invoice.status}</td><td className="p-3 text-slate-400">{invoice.membership_name || '-'}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </DashboardShell>;
}

export default function MemberInvoicesPage() { return <ProtectedRoute allowedRoles={['member']}><MemberInvoices /></ProtectedRoute>; }
