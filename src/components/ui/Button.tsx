import { ButtonHTMLAttributes, LinkHTMLAttributes, forwardRef } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft hover:shadow-card',
  secondary: 'bg-secondary-900 text-white hover:bg-secondary-800 shadow-soft',
  outline: 'border border-secondary-300 bg-white text-secondary-800 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50',
  ghost: 'text-secondary-700 hover:bg-secondary-100',
  danger: 'bg-error-600 text-white hover:bg-error-700 shadow-soft',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & CommonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  )
);
Button.displayName = 'Button';

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: CommonProps & { to: string; children: React.ReactNode } & Omit<LinkHTMLAttributes<HTMLAnchorElement>, 'to'>) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
