import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { LinkButton } from '@/components/ui/Button';
import { useServices } from '@/hooks/useServices';

export function ServicesPage() {
  const servicesState = useServices();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Our Services
        </span>
        <h1 className="mt-4 text-4xl font-bold text-secondary-900 sm:text-5xl">Cleaning Services</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary-600">
          Professional cleaning solutions for every type of space. Browse our available services and
          book the one that fits your needs.
        </p>
      </div>

      <div className="mt-12">
        {servicesState.status === 'loading' && <LoadingState label="Loading services…" />}
        {servicesState.status === 'error' && (
          <ErrorState title="Couldn't load services" description={servicesState.message} />
        )}
        {servicesState.status === 'success' && servicesState.services.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="Our services are being prepared"
            description="Please check back soon. Our team is putting together the full list of cleaning services."
            action={<LinkButton to="/contact" variant="outline">Contact us</LinkButton>}
          />
        )}
        {servicesState.status === 'success' && servicesState.services.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicesState.services.map((service) => (
              <Card key={service.id} className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-elevated hover:-translate-y-0.5">
                <Link to={`/services/${service.slug}`} className="block">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-primary-50">
                      <Sparkles className="h-10 w-10 text-primary-300" aria-hidden="true" />
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    <Link to={`/services/${service.slug}`} className="group-hover:text-primary-600">
                      {service.name}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-secondary-600 line-clamp-3">
                    {service.short_description ?? service.description ?? ''}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-700">
                      From ${Number(service.starting_price).toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <LinkButton to={`/services/${service.slug}`} variant="outline" size="sm" className="flex-1">
                      View Service
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </LinkButton>
                    <LinkButton to={`/quote?service=${service.slug}`} size="sm" className="flex-1">
                      <Calculator className="h-4 w-4" aria-hidden="true" />
                      Get a Quote
                    </LinkButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
