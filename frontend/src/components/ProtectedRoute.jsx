import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a page component and redirects to /login if unauthenticated,
 * or to the user's own dashboard if their role isn't in `allowedRoles`.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading, homeForRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [user, loading]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0f12] text-slate-300">
        <div className="flex items-center gap-3">
          <svg
            className="h-6 w-6 animate-spin text-emerald-400/60"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-light tracking-wide">Loading…</span>
        </div>
      </div>
    );
  }

  return children;
}