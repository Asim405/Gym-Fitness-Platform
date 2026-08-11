import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

function MemberQrCode() {
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get('/attendance/qr')
      .then((res) => setPayload(res.data.payload || ''))
      .catch(() => setError('Unable to generate QR payload.'));
  }, []);

  async function handleCopy() {
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardShell title="My QR pass" subtitle="Generate your member QR payload for entry scanning">
      <div className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Present this code at check-in</h2>
          <p className="text-sm text-slate-500 mb-4">
            Use this QR payload during class or entry scanning. Trainers and front desk staff can scan it to record your attendance.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <pre className="whitespace-pre-wrap break-all text-sm text-slate-800">{payload || 'Generating QR payload…'}</pre>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!payload}
            className="mt-4 inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {copied ? 'Copied!' : 'Copy payload'}
          </button>
        </section>
      </div>
    </DashboardShell>
  );
}

export default function MemberQrCodePage() {
  return (
    <ProtectedRoute allowedRoles={['member', 'admin']}>
      <MemberQrCode />
    </ProtectedRoute>
  );
}
