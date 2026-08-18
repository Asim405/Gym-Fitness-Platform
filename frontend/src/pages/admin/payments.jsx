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

  // ---- New state for membership requests ----
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState('');

  // ---- Load all data (payments, invoices, pending requests) ----
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
      .catch((err) => setError(err.response?.data?.error || 'Unable to load financial records or pending requests.'))
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
      await api.patch(`/memberships/${requestId}/status`, { status: action === 'approve' ? 'active' : 'rejected' });
      setRequestMessage(`Membership request ${action}ed successfully.`);
      // Refresh the list
      const res = await api.get('/memberships', { params: { status: 'pending' } });
      setRequests(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} request.`);
    }
  };

  const pending = invoices.filter((invoice) => ['pending', 'overdue'].includes(invoice.status));
  const paidTotal = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

  return (
    <DashboardShell
      title="Payments & invoices"
      subtitle="Monitor member billing records without recording unverified gateway payments."
    >
      {error && (
        <p className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {requestMessage && (
        <p className="rounded-3xl border border-emerald-700 bg-emerald-950/80 px-4 py-3 text-sm text-emerald-200">
          {requestMessage}
        </p>
      )}

      {loading ? (
        <p className="text-slate-400">Loading financial records…</p>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Summary label="Recorded payments" value={payments.length} />
            <Summary label="Payment total" value={money(paidTotal)} />
            <Summary label="Outstanding invoices" value={pending.length} />
          </div>

          {/* ---- New: Pending membership requests ---- */}
          <section className="rounded-[2rem] border border-amber-500/30 bg-slate-900/95 p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              Pending membership subscriptions
              {requests.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                  {requests.length}
                </span>
              )}
            </h2>
            {requestsLoading ? (
              <p className="mt-4 text-sm text-slate-400">Loading requests…</p>
            ) : requests.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No pending subscription requests.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{req.member_name}</p>
                      <p className="text-sm text-slate-400">
                        {req.plan_name} · {money(req.amount_paid || 0)} · requested{' '}
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRequestAction(req.id, 'approve')}
                        className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, 'reject')}
                        className="rounded-2xl border border-rose-700 px-5 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-950/30"
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
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
            <h2 className="text-xl font-semibold text-white">Outstanding invoices</h2>
            {pending.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No outstanding invoices.</p>
            ) : (
              <Table
                headers={['Invoice', 'Member', 'Due date', 'Amount', 'Status']}
              >
                {pending.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-800">
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
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
            <h2 className="text-xl font-semibold text-white">Recent payments</h2>
            {payments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No payments have been recorded.</p>
            ) : (
              <Table
                headers={['Member ID', 'Method', 'Reference', 'Amount', 'Recorded']}
              >
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-800">
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

// ---- Helper components (unchanged) ----
function Summary({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900 px-5 py-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Cell({ children }) {
  return <td className="p-3 text-sm text-slate-300">{children}</td>;
}

function Table({ headers, children }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((header) => (
              <th className="p-3" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Status({ value }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs capitalize ${
        value === 'paid'
          ? 'bg-emerald-500/15 text-emerald-300'
          : value === 'overdue'
          ? 'bg-rose-500/15 text-rose-300'
          : 'bg-amber-500/15 text-amber-300'
      }`}
    >
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