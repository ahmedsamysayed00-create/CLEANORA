import { useEffect, useState } from 'react';
import { Calculator, Plus, Trash2, Power } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select, Label, FieldError } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useServices } from '@/hooks/useServices';
import type { PricingRule } from '@/types/database';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; rules: PricingRule[] };

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('unique') || lower.includes('duplicate'))
    return 'A pricing rule with this key already exists.';
  return 'We couldn\'t save your changes. Please try again.';
}

export function AdminPricing() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const servicesState = useServices();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ service_id: '', rule_key: '', rule_label: '', price_modifier: '0', modifier_type: 'additive' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!supabase) { setState({ status: 'success', rules: [] }); return; }
    setState({ status: 'loading' });
    const { data, error } = await supabase.from('pricing_rules').select('*').order('created_at', { ascending: true });
    if (error) setState({ status: 'error', message: 'We couldn\'t load pricing rules. Please try again.' });
    else setState({ status: 'success', rules: (data as PricingRule[]) ?? [] });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!supabase) return;
    if (!form.rule_key.trim()) {
      setError('Rule key is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      service_id: form.service_id || null,
      rule_key: form.rule_key.trim(),
      rule_label: form.rule_label || null,
      price_modifier: Number(form.price_modifier) || 0,
      modifier_type: form.modifier_type,
      is_active: true,
    };
    const { error } = await supabase.from('pricing_rules').insert(payload);
    setSaving(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    setShowForm(false);
    setForm({ service_id: '', rule_key: '', rule_label: '', price_modifier: '0', modifier_type: 'additive' });
    toast('success', 'Pricing rule added.');
    await load();
  };

  const handleDeleteConfirm = async () => {
    if (!supabase || !deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('pricing_rules').delete().eq('id', deleteId);
    setDeleting(false);
    if (error) {
      toast('error', 'We couldn\'t delete this rule. Please try again.');
    } else {
      toast('success', 'Pricing rule deleted.');
      await load();
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (rule: PricingRule) => {
    if (!supabase) return;
    const { error } = await supabase.from('pricing_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
    if (error) {
      toast('error', 'We couldn\'t update this rule. Please try again.');
    } else {
      toast('success', rule.is_active ? 'Rule deactivated.' : 'Rule activated.');
      await load();
    }
  };

  if (profile?.role !== 'admin') {
    return <div className="p-8"><ErrorState title="Access denied" description="You do not have permission to view this page." /></div>;
  }

  const services = servicesState.status === 'success' ? servicesState.services : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Pricing Rules</h1>
          <p className="mt-1 text-sm text-secondary-500">Configure dynamic pricing modifiers for services. Changes take effect immediately on quotes and new bookings.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add rule
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="service_id">Service (leave empty for global rule)</Label>
              <Select id="service_id" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
                <option value="">Global (all services)</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule_key">Rule key</Label>
                <Input id="rule_key" required value={form.rule_key} onChange={(e) => setForm({ ...form, rule_key: e.target.value })} placeholder="e.g. bedroom_extra" />
              </div>
              <div>
                <Label htmlFor="rule_label">Rule label</Label>
                <Input id="rule_label" value={form.rule_label} onChange={(e) => setForm({ ...form, rule_label: e.target.value })} placeholder="e.g. Per bedroom" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_modifier">Price modifier</Label>
                <Input id="price_modifier" type="number" step="0.01" value={form.price_modifier} onChange={(e) => setForm({ ...form, price_modifier: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="modifier_type">Modifier type</Label>
                <Select id="modifier_type" value={form.modifier_type} onChange={(e) => setForm({ ...form, modifier_type: e.target.value })}>
                  <option value="additive">Additive ($)</option>
                  <option value="multiplier">Multiplier (x)</option>
                </Select>
              </div>
            </div>
            {error && <FieldError>{error}</FieldError>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add rule'}</Button>
            </div>
          </form>
        </Card>
      )}

      {state.status === 'loading' && <LoadingState label="Loading pricing rules…" />}
      {state.status === 'error' && <ErrorState title="Couldn't load pricing rules" description={state.message} onRetry={load} />}
      {state.status === 'success' && state.rules.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={Calculator}
            title="No pricing rules yet"
            description="Add pricing rules to enable dynamic price calculation for your services."
          />
        </Card>
      )}
      {state.status === 'success' && state.rules.length > 0 && (
        <div className="grid gap-4">
          {state.rules.map((r) => (
            <Card key={r.id} className={`flex items-center justify-between gap-4 p-5 ${!r.is_active ? 'opacity-60' : ''}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-secondary-900">{r.rule_label || r.rule_key}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.is_active ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-500'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-secondary-500">
                  <code className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs">{r.rule_key}</code>
                  {' · '}
                  {r.modifier_type === 'additive' ? `+$${Number(r.price_modifier).toFixed(2)}` : `x${Number(r.price_modifier).toFixed(2)}`}
                  {' · '}
                  {r.service_id ? 'Service-specific' : 'Global'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(r)}
                  className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 hover:text-primary-600"
                  aria-label={r.is_active ? 'Deactivate rule' : 'Activate rule'}
                  title={r.is_active ? 'Deactivate' : 'Activate'}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteId(r.id)} className="rounded-lg p-2 text-secondary-600 hover:bg-error-50 hover:text-error-600" aria-label="Delete rule">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete pricing rule?"
        description="This pricing rule will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
