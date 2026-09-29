import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, CalendarCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LinkButton } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-secondary-200/80 bg-white/90 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main navigation">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={close}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-primary-700' : 'text-secondary-600 hover:text-primary-600'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={profile?.role === 'admin' ? '/admin' : '/customer/dashboard'}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-secondary-700 hover:text-primary-600"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:text-error-600"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-medium text-secondary-700 hover:text-primary-600">
                Login
              </Link>
              <Link to="/signup" className="rounded-lg px-3.5 py-2 text-sm font-medium text-secondary-700 hover:text-primary-600">
                Sign Up
              </Link>
            </>
          )}
          <LinkButton to="/book" size="md">
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Book a Service
          </LinkButton>
        </div>

        <button
          className="rounded-lg p-2 text-secondary-700 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-secondary-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={close}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-base font-medium ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="my-2 h-px bg-secondary-200" />
            {user ? (
              <>
                <Link
                  to={profile?.role === 'admin' ? '/admin' : '/customer/dashboard'}
                  onClick={close}
                  className="rounded-lg px-4 py-3 text-base font-medium text-secondary-700 hover:bg-secondary-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { signOut(); close(); }}
                  className="rounded-lg px-4 py-3 text-left text-base font-medium text-error-600 hover:bg-error-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close} className="rounded-lg px-4 py-3 text-base font-medium text-secondary-700 hover:bg-secondary-50">
                  Login
                </Link>
                <Link to="/signup" onClick={close} className="rounded-lg px-4 py-3 text-base font-medium text-secondary-700 hover:bg-secondary-50">
                  Sign Up
                </Link>
              </>
            )}
            <LinkButton to="/book" className="mt-2 w-full" onClick={close}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Book a Service
            </LinkButton>
          </div>
        </div>
      )}
    </header>
  );
}
