import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select, Label } from '@/components/ui/Input';
import { LinkButton } from '@/components/ui/Button';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useServices } from '@/hooks/useServices';
import { usePricingRules } from '@/hooks/usePricingRules';
import { calculateEstimateFromRules } from '@/utils/pricing';

export function QuotePage() {
  const [searchParams] = useSearchParams();
  const serviceSlug = searchParams.get('service');
  const servicesState = useServices();
  const pricingRulesState = usePricingRules();
  const [serviceId, setServiceId] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);

  // Preselect service from URL slug once services are loaded
  useEffect(() => {
    if (servicesState.status === 'success' && serviceSlug && !serviceId) {
      const matched = servicesState.services.find((s) => s.slug === serviceSlug);
      if (matched) setServiceId(matched.id);
    }
  }, [servicesState, serviceSlug, serviceId]);

  const selectedService = useMemo(() => {
    if (servicesState.status !== 'success') return null;
    return servicesState.services.find((s) => s.id === serviceId) ?? null;
  }, [servicesState, serviceId]);

  const estimate = useMemo(() => {
    if (!selectedService || pricingRulesState.status !== 'success') return null;
    return calculateEstimateFromRules({
      startingPrice: Number(selectedService.starting_price),
      propertyType,
      bedrooms,
      bathrooms,
      rules: pricingRulesState.rules,
    });
  }, [selectedService, pricingRulesState, bedrooms, bathrooms, propertyType]);

  const isLoading = servicesState.status === 'loading' || pricingRulesState.status === 'loading';
  const hasError = servicesState.status === 'error' || pricingRulesState.status === 'error';
  const errorMsg = servicesState.status === 'error'
    ? servicesState.message
    : pricingRulesState.status === 'error'
      ? pricingRulesState.message
      : '';

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
          <Calculator className="h-4 w-4" aria-hidden="true" />
          Free Quote
        </span>
        <h1 className="mt-4 text-4xl font-bold text-secondary-900 sm:text-5xl">Get a free estimate</h1>
        <p className="mt-4 text-lg text-secondary-600">
          Tell us about your space and we will provide an estimated price based on the service you choose.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        {isLoading && <LoadingState label="Loading pricing configuration…" />}
        {hasError && (
          <ErrorState title="Couldn't load pricing" description={errorMsg} />
        )}
        {servicesState.status === 'success' && servicesState.services.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="No services available yet"
            description="Our services are being prepared. Please check back soon to get a quote."
            action={<LinkButton to="/contact" variant="outline">Contact us</LinkButton>}
          />
        )}
        {servicesState.status === 'success' && servicesState.services.length > 0 && pricingRulesState.status === 'success' && (
          <Card className="p-8">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <Label htmlFor="service">Service</Label>
                <Select
                  id="service"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  <option value="">Select a service…</option>
                  {servicesState.services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="propertyType">Property type</Label>
                <Select id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="office">Office</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    max={10}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Math.max(0, Number(e.target.value)))}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    max={10}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
            </form>

            {estimate !== null && (
              <div className="mt-8 rounded-2xl bg-primary-50 p-6 text-center">
                <p className="text-sm text-primary-700">Starting at ${Number(selectedService?.starting_price).toFixed(0)}</p>
                <p className="mt-1 text-4xl font-bold text-primary-700">${estimate}</p>
                <p className="mt-2 text-xs text-secondary-500">
                  Preliminary estimate. Final pricing is confirmed when you book.
                </p>
                <LinkButton to={serviceId ? `/book?service=${selectedService?.slug ?? ''}` : '/book'} className="mt-5">
                  Book this service
                </LinkButton>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
