import { useState } from 'react';
import { User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

export function CustomerProfile() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Please enter your name.';
    if (form.phone && form.phone.length < 7) e.phone = 'Please enter a valid phone number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!supabase || !user) return;
    if (!validate()) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name, phone: form.phone })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast('error', 'We couldn\'t save your changes. Please try again.');
    } else {
      toast('success', 'Profile updated successfully.');
      await refreshProfile();
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">My Profile</h1>
        <p className="mt-1 text-sm text-secondary-500">Update your personal information.</p>
      </div>

      <Card className="max-w-lg p-8">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <User className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-secondary-900">{profile?.full_name || 'Your name'}</p>
            <p className="text-sm text-secondary-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              aria-invalid={!!errors.full_name}
            />
            <FieldError>{errors.full_name}</FieldError>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              aria-invalid={!!errors.phone}
              placeholder="Optional"
            />
            <FieldError>{errors.phone}</FieldError>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
