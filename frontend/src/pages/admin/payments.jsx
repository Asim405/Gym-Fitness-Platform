import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import {
  CurrencyRupeeIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // ---- New state for membership requests ----
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState('');

  // ---- Load all data ----
  const loadData = () => {
    setLoading(true);
    setRequestsLoading(true);
    setError('');
    setRequestMessage('');

    Promise.all([
      api.get('/payments', { params: { limit: 50 } }),
      api.get('/invoices'),
      api.get('/memberships', { params: { status: 'pending' } }),
    ])
      .then(([paymentResult, invoiceResult, requestResult]) => {
        setPayments(paymentResult.data.data || []);
        setInvoices(invoiceResult.data.data || []);
        setRequests(requestResult.data.data || []);
      })
      .catch((err) =>
        setError(err.response?.data?.error || 'Unable to load financial records or pending requests.')
      )
      .finally(() => {
        setLoading(false);
        setRequestsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---- Handle approve / reject ----
  const handleRequestAction = async (requestId, action) => {
    setRequestMessage('');
    setError('');
    try {
      await api.patch(`/memberships/${requestId}/status`, {
        status: action === 'approve' ? 'active' : 'rejected',
      });
      setRequestMessage(`Membership request ${action}ed successfully.`);
      // Refresh the list
      const res = await api.get('/memberships', { params: { status: 'pending' } });
      setRequests(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} request.`);
    }
  };

  const pending = invoices.filter((invoice) =>
    ['pending', 'overdue'].includes(invoice.status)
  );
  const paidTotal = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

  return (
    <DashboardShell
      title="Payments & invoices"
      subtitle="Monitor member billing records without recording unverified gateway payments."
    >
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {requestMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
          {requestMessage}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading financial records…</p>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Summary
              label="Recorded payments"
              value={payments.length}
              icon={CreditCardIcon}
              accent="emerald"
            />
            <Summary
              label="Payment total"
              value={money(paidTotal)}
              icon={CurrencyRupeeIcon}
              accent="amber"
            />
            <Summary
              label="Outstanding invoices"
              value={pending.length}
              icon={ClipboardDocumentCheckIcon}
              accent="rose"
            />
          </div>

          {/* ---- Pending membership requests ---- */}
          <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-amber-400/60" />
              <h2 className="text-base font-light tracking-tight text-white/90">
                Pending membership subscriptions
              </h2>
              {requests.length > 0 && (
                <span className="ml-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300/70">
                  {requests.length}
                </span>
              )}
            </div>
            {requestsLoading ? (
              <p className="mt-4 text-sm text-slate-400">Loading requests…</p>
            ) : requests.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No pending subscription requests.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-light text-white/80">{req.member_name}</p>
                      <p className="text-sm text-slate-400">
                        {req.plan_name} · {money(req.amount_paid || 0)} · requested{' '}
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRequestAction(req.id, 'approve')}
                        className="rounded-lg bg-emerald-500/90 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, 'reject')}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-5 py-1.5 text-sm font-medium text-rose-300/70 hover:bg-rose-500/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Outstanding invoices */}
          <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-rose-400/60" />
              <h2 className="text-base font-light tracking-tight text-white/90">Outstanding invoices</h2>
            </div>
            {pending.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No outstanding invoices.</p>
            ) : (
              <Table
                headers={['Invoice', 'Member', 'Due date', 'Amount', 'Status']}
              >
                {pending.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <Cell>{invoice.invoice_number}</Cell>
                    <Cell>{invoice.member_name}</Cell>
                    <Cell>
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : '—'}
                    </Cell>
                    <Cell>{money(invoice.amount)}</Cell>
                    <Cell>
                      <Status value={invoice.status} />
                    </Cell>
                  </tr>
                ))}
              </Table>
            )}
          </section>

          {/* Recent payments */}
          <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-emerald-400/60" />
              <h2 className="text-base font-light tracking-tight text-white/90">Recent payments</h2>
            </div>
            {payments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No payments have been recorded.</p>
            ) : (
              <Table
                headers={['Member ID', 'Method', 'Reference', 'Amount', 'Recorded']}
              >
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <Cell>#{payment.member_id}</Cell>
                    <Cell>{payment.payment_method}</Cell>
                    <Cell>{payment.reference || '—'}</Cell>
                    <Cell>{money(payment.amount)}</Cell>
                    <Cell>{new Date(payment.created_at).toLocaleDateString()}</Cell>
                  </tr>
                ))}
              </Table>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

// ---- Helper components ----
function Summary({ label, value, icon: Icon, accent }) {
  const accentMap = {
    emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300/70' },
    amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-300/70' },
    rose: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-300/70' },
    sky: { border: 'border-sky-500/20', bg: 'bg-sky-500/10', text: 'text-sky-300/70' },
  };
  const { border, bg, text } = accentMap[accent] || accentMap.emerald;

  return (
    <div className={`rounded-xl border ${border} ${bg} p-5 shadow-2xl shadow-black/20`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${text}`} />
        <p className="text-sm font-light text-slate-400">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-light ${text}`}>{value}</p>
    </div>
  );
}

function Cell({ children }) {
  return <td className="p-3 text-sm text-slate-300">{children}</td>;
}

function Table({ headers, children }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/5 text-slate-500">
          <tr>
            {headers.map((header) => (
              <th className="p-3 font-light uppercase tracking-wider text-xs" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

function Status({ value }) {
  const config = {
    paid: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300/70', icon: CheckCircleIcon },
    pending: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-300/70', icon: ClockIcon },
    overdue: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-300/70', icon: XCircleIcon },
  };
  const { border, bg, text, icon: Icon } = config[value] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${border} ${bg} px-2.5 py-0.5 text-xs font-medium ${text}`}>
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

export default function AdminPayments() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <PaymentsPage />
    </ProtectedRoute>
  );
}