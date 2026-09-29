import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-display font-bold text-primary-700 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-soft">
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-xl tracking-tight">Cleanora</span>
    </Link>
  );
}
