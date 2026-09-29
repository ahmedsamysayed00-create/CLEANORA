import { AlertTriangle } from 'lucide-react';
import { supabaseConfigError } from '@/lib/supabase';

export function ConfigBanner() {
  if (!supabaseConfigError) return null;
  return (
    <div className="bg-warning-50 border-b border-warning-100" role="alert">
      <div className="container-page flex items-center gap-3 py-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-warning-600" aria-hidden="true" />
        <p className="text-sm text-warning-700">
          <strong className="font-semibold">Configuration required:</strong> {supabaseConfigError}
        </p>
      </div>
    </div>
  );
}
