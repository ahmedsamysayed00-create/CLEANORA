import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Sparkles, Calculator, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { LinkButton } from '@/components/ui/Button';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
  { to: '/admin/services', label: 'Services', icon: Sparkles, end: false },
  { to: '/admin/pricing', label: 'Pricing Rules', icon: Calculator, end: false },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="border-b border-secondary-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="hidden rounded-full bg-secondary-900 px-3 py-1 text-xs font-semibold text-white sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LinkButton to="/" variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </LinkButton>
            <button onClick={signOut} className="text-sm font-medium text-secondary-600 hover:text-error-600">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Admin navigation">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-secondary-900 text-white'
                      : 'text-secondary-600 hover:bg-secondary-100'
                  }`
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 hidden rounded-2xl border border-secondary-200 bg-white p-4 lg:block">
            <p className="text-sm font-semibold text-secondary-900">{profile?.full_name || 'Admin'}</p>
            <p className="text-xs text-secondary-500">Administrator</p>
          </div>
        </aside>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
