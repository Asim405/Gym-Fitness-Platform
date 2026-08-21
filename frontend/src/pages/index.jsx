import { useEffect } from 'react';
import { useRouter } from 'next/router';
import PulseFitLanding from '../components/PulseFitLanding';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading, homeForRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(homeForRole(user.role));
  }, [user, loading, homeForRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0f12] text-slate-400">
        Loading…
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0f12] text-slate-400">
        Redirecting…
      </div>
    );
  }

  return <PulseFitLanding />;
}
