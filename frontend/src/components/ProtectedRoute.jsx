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
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return children;
}
