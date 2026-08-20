import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';
import { QrCodeIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

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
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Present this code at check-in</h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Use this QR payload during class or entry scanning. Trainers and front desk staff can scan it to record your attendance.
          </p>

          <div className="mt-4 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-5">
            <pre className="whitespace-pre-wrap break-all text-sm text-slate-300 font-mono">
              {payload || 'Generating QR payload…'}
            </pre>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!payload}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500/90 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
          >
            {copied ? (
              <>
                <ClipboardDocumentCheckIcon className="h-5 w-5" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-5 w-5" />
                Copy payload
              </>
            )}
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