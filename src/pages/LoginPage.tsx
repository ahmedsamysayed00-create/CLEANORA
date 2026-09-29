import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Button, LinkButton } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { supabaseConfigError } from '@/lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from ?? '/customer/dashboard';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email.';
    if (!form.password) e.password = 'Please enter your password.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-secondary-900">Welcome back</h1>
          <p className="mt-2 text-sm text-secondary-500">Sign in to your Cleanora account.</p>
        </div>

        {supabaseConfigError && (
          <div className="mt-6 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            {supabaseConfigError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} autoComplete="email" />
            <FieldError>{errors.email}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!errors.password} autoComplete="current-password" />
            <FieldError>{errors.password}</FieldError>
          </div>
          {submitError && (
            <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {submitError}
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">Sign up</Link>
        </p>
      </Card>
      <div className="mt-6">
        <LinkButton to="/" variant="ghost" size="sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Back to home
        </LinkButton>
      </div>
    </div>
  );
}
