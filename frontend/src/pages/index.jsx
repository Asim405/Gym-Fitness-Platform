import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading, homeForRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homeForRole(user.role) : '/login');
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
      Loading…
    </div>
  );
}
