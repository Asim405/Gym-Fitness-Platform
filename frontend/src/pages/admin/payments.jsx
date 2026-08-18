import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/payments', { params: { limit: 50 } }), api.get('/invoices')])
      .then(([paymentResult, invoiceResult]) => {
        setPayments(paymentResult.data.data || []);
        setInvoices(invoiceResult.data.data || []);
      })
      .catch((err) => setError(err.response?.data?.error || 'Unable to load payments and invoices.'))
      .finally(() => setLoading(false));
  }, []);

  const pending = invoices.filter((invoice) => ['pending', 'overdue'].includes(invoice.status));
  const paidTotal = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

  return (
    <DashboardShell title="Payments & invoices" subtitle="Monitor member billing records without recording unverified gateway payments.">
      {error && <p className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</p>}
      {loading ? <p className="text-slate-400">Loading financial records…</p> : <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Summary label="Recorded payments" value={payments.length} />
          <Summary label="Payment total" value={money(paidTotal)} />
          <Summary label="Outstanding invoices" value={pending.length} />
        </div>
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
          <h2 className="text-xl font-semibold text-white">Outstanding invoices</h2>
          {pending.length === 0 ? <p className="mt-4 text-sm text-slate-400">No outstanding invoices.</p> : <Table headers={['Invoice', 'Member', 'Due date', 'Amount', 'Status']}>
            {pending.map((invoice) => <tr key={invoice.id} className="border-t border-slate-800"><Cell>{invoice.invoice_number}</Cell><Cell>{invoice.member_name}</Cell><Cell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</Cell><Cell>{money(invoice.amount)}</Cell><Cell><Status value={invoice.status} /></Cell></tr>)}
          </Table>}
        </section>
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
          <h2 className="text-xl font-semibold text-white">Recent payments</h2>
          {payments.length === 0 ? <p className="mt-4 text-sm text-slate-400">No payments have been recorded.</p> : <Table headers={['Member ID', 'Method', 'Reference', 'Amount', 'Recorded']}>
            {payments.map((payment) => <tr key={payment.id} className="border-t border-slate-800"><Cell>#{payment.member_id}</Cell><Cell>{payment.payment_method}</Cell><Cell>{payment.reference || '—'}</Cell><Cell>{money(payment.amount)}</Cell><Cell>{new Date(payment.created_at).toLocaleDateString()}</Cell></tr>)}
          </Table>}
        </section>
      </div>}
    </DashboardShell>
  );
}

function Summary({ label, value }) { return <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900 px-5 py-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>; }
function Cell({ children }) { return <td className="p-3 text-sm text-slate-300">{children}</td>; }
function Table({ headers, children }) { return <div className="mt-4 overflow-x-auto"><table className="min-w-full text-left"><thead className="text-xs uppercase tracking-wide text-slate-500"><tr>{headers.map((header) => <th className="p-3" key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function Status({ value }) { return <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${value === 'paid' ? 'bg-emerald-500/15 text-emerald-300' : value === 'overdue' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{value}</span>; }

export default function AdminPayments() { return <ProtectedRoute allowedRoles={['admin']}><PaymentsPage /></ProtectedRoute>; }
