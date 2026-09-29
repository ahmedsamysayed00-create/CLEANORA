import { useState, useEffect } from 'react';
import { Sparkles, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Label, FieldError } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Service } from '@/types/database';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; services: Service[] };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('unique') || lower.includes('duplicate'))
    return 'A service with this name or slug already exists.';
  if (lower.includes('foreign key') || lower.includes('violates'))
    return 'This service cannot be deleted because it has existing bookings.';
  return 'We couldn\'t save your changes. Please try again.';
}

export function AdminServices() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    starting_price: '0',
    estimated_duration: '',
    image_url: '',
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!supabase) { setState({ status: 'success', services: [] }); return; }
    setState({ status: 'loading' });
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    if (error) setState({ status: 'error', message: 'We couldn\'t load services. Please try again.' });
    else setState({ status: 'success', services: (data as Service[]) ?? [] });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', short_description: '', description: '', starting_price: '0', estimated_duration: '', image_url: '', is_active: true });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      slug: s.slug,
      short_description: s.short_description ?? '',
      description: s.description ?? '',
      starting_price: String(s.starting_price),
      estimated_duration: s.estimated_duration ?? '',
      image_url: s.image_url ?? '',
      is_active: s.is_active,
    });
    setError(null);
    setShowForm(true);
  };

  const validateForm = () => {
    const errs: string[] = [];
    if (!form.name.trim()) errs.push('Name is required.');
    const finalSlug = form.slug || slugify(form.name);
    if (!finalSlug) errs.push('Slug is required.');
    else if (!/^[a-z0-9-]+$/.test(finalSlug)) errs.push('Slug can only contain lowercase letters, numbers, and hyphens.');
    if (Number(form.starting_price) < 0) errs.push('Starting price cannot be negative.');
    return errs;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!supabase) return;
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '));
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      short_description: form.short_description || null,
      description: form.description || null,
      starting_price: Number(form.starting_price) || 0,
      estimated_duration: form.estimated_duration || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    };

    const { error } = editing
      ? await supabase.from('services').update(payload).eq('id', editing.id)
      : await supabase.from('services').insert(payload);

    setSaving(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    setShowForm(false);
    toast('success', editing ? 'Service updated successfully.' : 'Service created successfully.');
    await load();
  };

  const handleDeleteConfirm = async () => {
    if (!supabase || !deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('services').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast('error', friendlyError(error.message));
    } else {
      toast('success', 'Service deleted.');
      await load();
    }
    setDeleteTarget(null);
  };

  if (profile?.role !== 'admin') {
    return <div className="p-8"><ErrorState title="Access denied" description="You do not have permission to view this page." /></div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Services</h1>
          <p className="mt-1 text-sm text-secondary-500">Create and manage cleaning services.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add service
        </Button>
      </div>

      {state.status === 'loading' && <LoadingState label="Loading services…" />}
      {state.status === 'error' && <ErrorState title="Couldn't load services" description={state.message} onRetry={load} />}
      {state.status === 'success' && state.services.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={Sparkles}
            title="No services yet"
            description="Create your first cleaning service to get started."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden="true" />Add service</Button>}
          />
        </Card>
      )}
      {state.status === 'success' && state.services.length > 0 && (
        <div className="grid gap-4">
          {state.services.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                {s.image_url ? (
                  <img src={s.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-300">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </span>
                )}
                <div>
                  <p className="font-semibold text-secondary-900">{s.name}</p>
                  <p className="text-sm text-secondary-500">/{s.slug} · From ${Number(s.starting_price).toFixed(0)}</p>
                  {!s.is_active && <span className="mt-1 inline-block rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">Inactive</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 hover:text-primary-600" aria-label={`Edit ${s.name}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(s)} className="rounded-lg p-2 text-secondary-600 hover:bg-error-50 hover:text-error-600" aria-label={`Delete ${s.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setShowForm(false)}>
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">{editing ? 'Edit service' : 'Add service'}</h2>
              <button onClick={() => !saving && setShowForm(false)} className="rounded-lg p-1 text-secondary-500 hover:bg-secondary-100" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from name" />
              </div>
              <div>
                <Label htmlFor="short_description">Short description</Label>
                <Input id="short_description" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="description">Full description</Label>
                <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starting_price">Starting price ($)</Label>
                  <Input id="starting_price" type="number" min="0" step="0.01" value={form.starting_price} onChange={(e) => setForm({ ...form, starting_price: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="estimated_duration">Estimated duration</Label>
                  <Input id="estimated_duration" value={form.estimated_duration} onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} placeholder="e.g. 2-3 hours" />
                </div>
              </div>
              <div>
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input id="image_url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-secondary-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                Active (visible to customers)
              </label>
              {error && <FieldError>{error}</FieldError>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete service?"
        description={`Delete the service "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
