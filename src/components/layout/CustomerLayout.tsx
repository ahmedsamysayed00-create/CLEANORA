import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, User, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { LinkButton } from '@/components/ui/Button';

const customerNav = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customer/bookings', label: 'My Bookings', icon: CalendarDays, end: false },
  { to: '/customer/profile', label: 'Profile', icon: User, end: false },
];

export function CustomerLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="border-b border-secondary-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="hidden rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 sm:inline">
              Customer
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
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Customer navigation">
            {customerNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
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
            <p className="text-sm font-semibold text-secondary-900">{profile?.full_name || 'Customer'}</p>
            <p className="text-xs text-secondary-500">{profile?.role}</p>
          </div>
        </aside>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
