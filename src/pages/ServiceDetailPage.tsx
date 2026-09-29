import { useParams, Link } from 'react-router-dom';
import { Sparkles, Clock, Tag, ArrowLeft, CalendarCheck, CheckCircle2, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { LinkButton } from '@/components/ui/Button';
import { FAQ } from '@/components/FAQ';
import { useServiceBySlug } from '@/hooks/useServices';

const defaultFeatures = [
  'Trained and vetted cleaning professionals',
  'Flexible scheduling that fits your routine',
  'Detailed cleaning with attention to every room',
  'Book online in minutes',
];

const defaultFaq = [
  {
    question: 'How long does this service take?',
    answer: 'The estimated duration shown on this page is a general guideline. The actual time depends on the size and condition of your space, which you can specify when booking.',
  },
  {
    question: 'What is included in this service?',
    answer: 'A detailed breakdown of what is included will be provided when you book. You can also contact us with specific questions about your space.',
  },
  {
    question: 'How do I prepare for my cleaning?',
    answer: 'Please tidy up personal items so our team can focus on cleaning. Specific preparation instructions will be shared once your booking is confirmed.',
  },
];

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const state = useServiceBySlug(slug);

  if (state.status === 'loading') return <div className="container-page py-20"><LoadingState label="Loading service…" /></div>;

  if (state.status === 'not-found') {
    return (
      <div className="container-page py-20">
        <Card className="mx-auto max-w-lg p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-400">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-secondary-900">Service not found</h1>
          <p className="mt-2 text-secondary-500">The service you are looking for does not exist or is no longer available.</p>
          <LinkButton to="/services" variant="outline" className="mt-6">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to services
          </LinkButton>
        </Card>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="container-page py-20">
        <ErrorState title="Couldn't load this service" description={state.message} />
      </div>
    );
  }

  const service = state.service;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50/60 to-white">
        <div className="container-page py-12 lg:py-16">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-primary-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All services
          </Link>
          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 sm:text-4xl">{service.name}</h1>
              <p className="mt-4 text-lg text-secondary-600">
                {service.short_description ?? service.description ?? ''}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-secondary-200 bg-white px-4 py-2.5">
                  <Tag className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-secondary-500">Starting at</p>
                    <p className="text-sm font-semibold text-secondary-900">${Number(service.starting_price).toFixed(0)}</p>
                  </div>
                </div>
                {service.estimated_duration && (
                  <div className="flex items-center gap-2 rounded-xl border border-secondary-200 bg-white px-4 py-2.5">
                    <Clock className="h-5 w-5 text-primary-600" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-secondary-500">Estimated duration</p>
                      <p className="text-sm font-semibold text-secondary-900">{service.estimated_duration}</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-secondary-500">
                The final estimate depends on your property type, size, and selected options. Get a free quote for a personalized price.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton to={`/quote?service=${service.slug}`} size="lg">
                  <Calculator className="h-5 w-5" aria-hidden="true" />
                  Get an Estimate
                </LinkButton>
                <LinkButton to={`/book?service=${service.slug}`} variant="outline" size="lg">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                  Book This Service
                </LinkButton>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl shadow-card">
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="h-full max-h-80 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-80 w-full items-center justify-center bg-primary-50">
                  <Sparkles className="h-12 w-12 text-primary-300" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      {service.description && (
        <section className="container-page py-12 lg:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-secondary-900">About this service</h2>
            <p className="mt-4 text-secondary-600 whitespace-pre-line">{service.description}</p>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-secondary-100/60 py-12 lg:py-16">
        <div className="container-page mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-secondary-900">What's included</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {defaultFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 rounded-xl border border-secondary-200 bg-white p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
                <span className="text-sm text-secondary-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-12 lg:py-16">
        <Card className="flex flex-col items-center justify-between gap-6 p-8 sm:flex-row sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Ready to book this service?</h2>
            <p className="mt-2 text-secondary-600">Schedule your cleaning in just a few minutes.</p>
          </div>
          <LinkButton to={`/book?service=${service.slug}`} size="lg">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Book This Service
          </LinkButton>
        </Card>
      </section>

      <FAQ items={defaultFaq} title="Service FAQ" />
    </div>
  );
}
