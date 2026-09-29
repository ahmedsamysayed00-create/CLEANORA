import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin text-primary-600 ${className}`} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-secondary-500">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-secondary-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-error-100 bg-error-50 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-error-700">{title}</h3>
      {description && <p className="text-sm text-error-600">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl border border-error-300 bg-white px-5 py-2 text-sm font-semibold text-error-700 transition-colors hover:bg-error-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}
