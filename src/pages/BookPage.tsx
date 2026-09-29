import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CalendarCheck, Sparkles, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea, Label, FieldError } from '@/components/ui/Input';
import { Button, LinkButton } from '@/components/ui/Button';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useServices } from '@/hooks/useServices';
import { usePricingRules } from '@/hooks/usePricingRules';
import { useAvailability } from '@/hooks/useAvailability';
import { supabase } from '@/lib/supabase';
import { calculateEstimateFromRules } from '@/utils/pricing';
import { formatSlotLabel, getTodayString, friendlyErrorMessage, type SlotAvailability } from '@/utils/availability';
import { formatPrice } from '@/utils/bookingStatus';

export function BookPage() {
  const [searchParams] = useSearchParams();
  const serviceSlug = searchParams.get('service');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const servicesState = useServices();
  const pricingRulesState = usePricingRules();
  const { state: availState, fetchSlots } = useAvailability();

  const [form, setForm] = useState({
    serviceId: '',
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    bookingDate: '',
    bookingTime: '',
    address: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (servicesState.status === 'success' && serviceSlug && !form.serviceId) {
      const matched = servicesState.services.find((s) => s.slug === serviceSlug);
      if (matched) setForm((prev) => ({ ...prev, serviceId: matched.id }));
    }
  }, [servicesState, serviceSlug, form.serviceId]);

  // Fetch availability when date changes
  useEffect(() => {
    if (form.bookingDate) {
      fetchSlots(form.bookingDate);
      setForm((prev) => ({ ...prev, bookingTime: '' }));
    }
  }, [form.bookingDate, fetchSlots]);

  const selectedService = useMemo(() => {
    if (servicesState.status !== 'success') return null;
    return servicesState.services.find((s) => s.id === form.serviceId) ?? null;
  }, [servicesState, form.serviceId]);

  const estimate = useMemo(() => {
    if (!selectedService || pricingRulesState.status !== 'success') return null;
    return calculateEstimateFromRules({
      startingPrice: Number(selectedService.starting_price),
      propertyType: form.propertyType,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      rules: pricingRulesState.rules,
    });
  }, [selectedService, pricingRulesState, form.bedrooms, form.bathrooms, form.propertyType]);

  const slots: SlotAvailability[] = availState.status === 'success' ? availState.slots : [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.serviceId) e.serviceId = 'Please select a service.';
    if (!form.bookingDate) e.bookingDate = 'Please choose a date.';
    if (!form.bookingTime) e.bookingTime = 'Please select an available time slot.';
    if (!form.address.trim()) e.address = 'Please enter your address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (!user || !supabase) {
      setSubmitError('You must be signed in to book a service.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from('bookings').insert({
      customer_id: user.id,
      service_id: form.serviceId,
      property_type: form.propertyType,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      booking_date: form.bookingDate,
      booking_time: form.bookingTime,
      address: form.address,
      additional_notes: form.additionalNotes,
    }).select('id').single();
    setSubmitting(false);
    if (error) {
      const friendly = friendlyErrorMessage(error.message);
      setSubmitError(friendly);
      toast('error', friendly);
      if (form.bookingDate) fetchSlots(form.bookingDate);
      return;
    }
    toast('success', 'Booking submitted successfully.');
    navigate(`/booking-success/${data.id}`);
  };

  if (!user) {
    return (
      <div className="container-page py-16">
        <Card className="mx-auto max-w-lg p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <CalendarCheck className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-secondary-900">Sign in to book a service</h1>
          <p className="mt-2 text-secondary-500">You need an account to create a booking and track its status.</p>
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton to="/login">Login</LinkButton>
            <LinkButton to="/signup" variant="outline">Sign Up</LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const servicesLoading = servicesState.status === 'loading' || pricingRulesState.status === 'loading';
  const servicesError = servicesState.status === 'error' || pricingRulesState.status === 'error';
  const todayStr = getTodayString();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Book a Service
        </span>
        <h1 className="mt-4 text-4xl font-bold text-secondary-900 sm:text-5xl">Schedule your cleaning</h1>
        <p className="mt-4 text-lg text-secondary-600">
          Fill in the details below and we will get your booking set up.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        {servicesLoading && <LoadingState label="Loading services…" />}
        {servicesError && (
          <ErrorState title="Couldn't load services" description="Please try again later." />
        )}
        {servicesState.status === 'success' && servicesState.services.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="No services available yet"
            description="Our services are being prepared. Please check back soon to book."
            action={<LinkButton to="/contact" variant="outline">Contact us</LinkButton>}
          />
        )}
        {servicesState.status === 'success' && servicesState.services.length > 0 && pricingRulesState.status === 'success' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Card className="p-8 space-y-5">
              <div>
                <Label htmlFor="service">Service</Label>
                <Select
                  id="service"
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                  aria-invalid={!!errors.serviceId}
                >
                  <option value="">Select a service…</option>
                  {servicesState.services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
                <FieldError>{errors.serviceId}</FieldError>
              </div>

              <div>
                <Label htmlFor="propertyType">Property type</Label>
                <Select id="propertyType" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="office">Office</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" type="number" min={0} max={10} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Math.max(0, Number(e.target.value)) })} />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" type="number" min={0} max={10} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Math.max(0, Number(e.target.value)) })} />
                </div>
              </div>

              <div>
                <Label htmlFor="bookingDate">Date</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  min={todayStr}
                  value={form.bookingDate}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  aria-invalid={!!errors.bookingDate}
                />
                <FieldError>{errors.bookingDate}</FieldError>
              </div>

              {/* Time slot grid */}
              <div>
                <Label>Available time</Label>
                {!form.bookingDate && (
                  <p className="rounded-xl border border-dashed border-secondary-300 bg-secondary-50 px-4 py-6 text-center text-sm text-secondary-400">
                    Select a date to see available time slots.
                  </p>
                )}
                {form.bookingDate && availState.status === 'loading' && (
                  <div className="flex items-center gap-2 py-4 text-sm text-secondary-500">
                    <Clock className="h-4 w-4 animate-pulse" aria-hidden="true" />
                    Checking availability…
                  </div>
                )}
                {form.bookingDate && availState.status === 'error' && (
                  <p className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">
                    Couldn't load availability. Please try a different date.
                  </p>
                )}
                {form.bookingDate && availState.status === 'success' && (
                  <div
                    role="radiogroup"
                    aria-label="Available time slots"
                    className="grid grid-cols-3 gap-2 sm:grid-cols-5"
                  >
                    {slots.map((slot) => {
                      const isSelected = form.bookingTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={!slot.available}
                          onClick={() => setForm({ ...form, bookingTime: slot.time })}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                            isSelected
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : slot.available
                                ? 'border-secondary-300 bg-white text-secondary-800 hover:border-primary-400 hover:bg-primary-50'
                                : 'border-secondary-200 bg-secondary-100 text-secondary-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {formatSlotLabel(slot.time)}
                        </button>
                      );
                    })}
                  </div>
                )}
                {form.bookingDate && availState.status === 'success' && slots.every((s) => !s.available) && (
                  <p className="mt-2 text-sm text-secondary-500">
                    All time slots for this date are taken. Please choose another date.
                  </p>
                )}
                <FieldError>{errors.bookingTime}</FieldError>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} aria-invalid={!!errors.address} />
                <FieldError>{errors.address}</FieldError>
              </div>

              <div>
                <Label htmlFor="additionalNotes">Additional notes (optional)</Label>
                <Textarea id="additionalNotes" rows={3} value={form.additionalNotes} onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })} />
              </div>
            </Card>

            {/* Booking summary */}
            {form.serviceId && form.bookingDate && form.bookingTime && (
              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-secondary-900">Booking Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Service</dt>
                    <dd className="font-medium text-secondary-900">{selectedService?.name ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Property</dt>
                    <dd className="font-medium text-secondary-900 capitalize">{form.propertyType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Bedrooms</dt>
                    <dd className="font-medium text-secondary-900">{form.bedrooms}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Bathrooms</dt>
                    <dd className="font-medium text-secondary-900">{form.bathrooms}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Date</dt>
                    <dd className="font-medium text-secondary-900">
                      {new Date(form.bookingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Time</dt>
                    <dd className="font-medium text-secondary-900">{formatSlotLabel(form.bookingTime)}</dd>
                  </div>
                </dl>
                {estimate !== null && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
                    <div>
                      <p className="text-xs text-primary-700">Estimated total</p>
                      <p className="text-xl font-bold text-primary-700">{formatPrice(estimate)}</p>
                    </div>
                    <p className="text-xs text-secondary-500 text-right">
                      Final price confirmed<br />after booking.
                    </p>
                  </div>
                )}
              </Card>
            )}

            {submitError && (
              <div className="flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                <span className="mt-0.5 font-semibold" aria-hidden="true">!</span>
                {submitError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting || !form.bookingTime}>
              {submitting ? 'Submitting…' : 'Confirm booking'}
              {!submitting && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
            </Button>

            {form.bookingTime && !submitting && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-secondary-400">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Your slot is reserved for you during submission.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
