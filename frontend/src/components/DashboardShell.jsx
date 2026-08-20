import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  CreditCardIcon,
  CalendarIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const NAV = {
  admin: [
    { label: 'Overview', href: '/admin/dashboard', icon: HomeIcon },
    { label: 'Members', href: '/admin/members', icon: UsersIcon },
    { label: 'Trainers', href: '/admin/trainers', icon: UserGroupIcon },
    { label: 'Memberships', href: '/admin/memberships', icon: CreditCardIcon },
    { label: 'Classes', href: '/admin/classes', icon: CalendarIcon },
    { label: 'Inventory', href: '/admin/inventory', icon: CubeIcon },
    { label: 'Payments & invoices', href: '/admin/payments', icon: ClipboardDocumentCheckIcon },
  ],
  trainer: [
    { label: 'Overview', href: '/trainer/dashboard', icon: HomeIcon },
    { label: 'Classes', href: '/trainer/classes', icon: CalendarIcon },
    { label: 'Diet plans', href: '/trainer/diet-plans', icon: ClipboardDocumentCheckIcon },
  ],
  member: [
    { label: 'Overview', href: '/member/dashboard', icon: HomeIcon },
    { label: 'Trainers', href: '/member/trainers', icon: UserGroupIcon },
    { label: 'My trainer', href: '/member/my-trainer', icon: UserIcon },
    { label: 'My membership', href: '/member/memberships', icon: CreditCardIcon },
    { label: 'Classes', href: '/member/classes', icon: CalendarIcon },
    { label: 'Diet plans', href: '/member/diet-plans', icon: ClipboardDocumentCheckIcon },
    { label: 'Billing', href: '/member/invoices', icon: ClipboardDocumentCheckIcon },
    { label: 'QR pass', href: '/member/qrcode', icon: CubeIcon },
  ],
};

function isActivePath(router, href) {
  return router.pathname === href || router.pathname.startsWith(href + '/');
}

export default function DashboardShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const items = NAV[user?.role] || [];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative bg-[#0c0f12] text-slate-200 font-sans antialiased">
      {/* Ultra‑subtle animated gradient background – no distracting orbs */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0c0f12] via-[#141a1f] to-[#1a232b] animate-gradient-subtle" />

      {/* Top navigation – clean, minimal, with a fine hairline border */}
      <header className="relative z-20 border-b border-white/5 bg-[#0c0f12]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand + mobile toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-slate-400 hover:text-white transition"
              >
                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl font-light tracking-wider text-white/90">
                  Pulse<span className="font-medium text-emerald-400">Fit</span>
                </span>
                <span className="hidden sm:inline-block text-xs font-light text-slate-500">| Gym Studio</span>
              </div>
            </div>

            {/* Desktop navigation – text links with subtle underline indicator */}
            <nav className="hidden lg:flex items-center gap-1">
              {items.map((item) => {
                const active = isActivePath(router, item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative flex items-center gap-2 px-3 py-2 text-sm font-light transition-colors duration-200 ${
                      active
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User menu – clean, minimal */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-light text-white/80 truncate max-w-[120px]">{user?.full_name || user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm font-light text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/5">
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = isActivePath(router, item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-light transition-colors ${
                        active
                          ? 'bg-white/5 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content – spacious, clean card with subtle shadow */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header with gentle underline */}
        <div className="mb-10">
          <h1 className="text-3xl font-light tracking-tight text-white/90">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-2 w-12 h-0.5 bg-emerald-400/60 rounded-full" />
        </div>

        {/* Content card – refined, minimal with a soft shadow */}
        <div className="rounded-2xl bg-[#141a1f]/80 border border-white/5 p-6 shadow-2xl shadow-black/30">
          {children}
        </div>
      </main>

      {/* Footer – subtle and quiet */}
      <footer className="relative z-10 text-center text-xs text-slate-500/50 py-6 border-t border-white/5 max-w-7xl mx-auto px-4 mt-8">
        © {new Date().getFullYear()} PulseFit — built with care.
      </footer>

      {/* Custom keyframe for subtle gradient animation */}
      <style jsx>{`
        @keyframes gradient-subtle {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-subtle {
          background-size: 300% 300%;
          animation: gradient-subtle 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}