import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const NAV = {
  admin: [
    { label: 'Overview', href: '/admin/dashboard' },
    { label: 'Inventory', href: '/admin/inventory' },
    { label: 'Billing', href: '/admin/dashboard' },
  ],
  trainer: [
    { label: 'Overview', href: '/trainer/dashboard' },
    { label: 'Diet plans', href: '/trainer/diet-plans' },
    { label: 'Classes', href: '/trainer/dashboard' },
  ],
  member: [
    { label: 'Overview', href: '/member/dashboard' },
    { label: 'Diet plans', href: '/member/diet-plans' },
    { label: 'Billing', href: '/member/invoices' },
    { label: 'QR pass', href: '/member/qrcode' },
  ],
};

export default function DashboardShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const items = NAV[user?.role] || [];

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-slate-950 text-slate-300 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800">
          <span className="text-emerald-500 font-bold tracking-tight">PULSE&nbsp;FIT</span>
          <div className="text-xs text-slate-500 mt-0.5 capitalize">{user?.role} panel</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                router.pathname === item.href
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'hover:bg-slate-900 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="px-3 py-2 text-sm text-slate-400 truncate">{user?.full_name || user?.email}</div>
          <button
            onClick={logout}
            className="w-full text-left rounded-md px-3 py-2 text-sm text-red-400 hover:bg-slate-900"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-5 sm:px-8">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </header>
        <div className="p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
