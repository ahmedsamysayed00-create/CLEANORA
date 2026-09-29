import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const footerNav = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const accountNav = [
  { to: '/login', label: 'Login' },
  { to: '/signup', label: 'Sign Up' },
  { to: '/book', label: 'Book a Service' },
];

export function Footer() {
  return (
    <footer className="border-t border-secondary-200 bg-white">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-display font-bold text-primary-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xl">Cleanora</span>
            </div>
            <p className="mt-4 text-sm text-secondary-500">
              Professional cleaning services for homes, offices, and move-in/move-out situations.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-secondary-900">Navigation</h3>
            <ul className="mt-4 space-y-2.5">
              {footerNav.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-secondary-500 hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-secondary-900">Account</h3>
            <ul className="mt-4 space-y-2.5">
              {accountNav.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-secondary-500 hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-secondary-900">Contact</h3>
            <p className="mt-4 text-sm text-secondary-500">
              Contact details will appear here once configured in your account settings.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-secondary-200 pt-6 flex items-center justify-between">
          <p className="text-sm text-secondary-400">
            &copy; {new Date().getFullYear()} Cleanora. All rights reserved.
          </p>
          <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-medium text-secondary-500">
            Portfolio Demo
          </span>
        </div>
      </div>
    </footer>
  );
}
