import { Link } from 'react-router-dom';
import {
  Sparkles,
  CalendarCheck,
  ClipboardList,
  Home as HomeIcon,
  Building2,
  Truck,
  ArrowRight,
  ShieldCheck,
  Clock,
  Star,
} from 'lucide-react';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { FAQ } from '@/components/FAQ';
import { useServices } from '@/hooks/useServices';

const heroImage =
  'https://images.pexels.com/photos/8146213/pexels-photo-8146213.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const howItWorks = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Choose Your Service',
    description: 'Browse our available cleaning services and select the one that fits your needs.',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Schedule Your Cleaning',
    description: 'Pick a date and time that works for you and tell us about your space.',
  },
  {
    icon: Sparkles,
    step: '03',
    title: 'Enjoy a Cleaner Space',
    description: 'Our professional team arrives on time and leaves your space spotless.',
  },
];

const serviceTypeIcons = [
  { icon: HomeIcon, label: 'Home Cleaning' },
  { icon: Building2, label: 'Office Cleaning' },
  { icon: Truck, label: 'Move In / Move Out' },
];

const trustFeatures = [
  { icon: ShieldCheck, title: 'Trusted Professionals', description: 'Our cleaning teams are vetted and trained to deliver consistent, high-quality results.' },
  { icon: Clock, title: 'Reliable Scheduling', description: 'Book online in minutes and choose a time slot that fits your schedule.' },
  { icon: Star, title: 'Quality Focused', description: 'We focus on the details that make your space feel genuinely clean and refreshed.' },
];

const faqItems = [
  {
    question: 'What types of cleaning services does Cleanora offer?',
    answer: 'Cleanora provides professional cleaning for homes, offices, and move-in/move-out situations. You can browse our available services on the Services page to see current offerings and pricing.',
  },
  {
    question: 'How do I book a cleaning service?',
    answer: 'You can book a service by clicking the "Book a Service" button anywhere on the site. You will create an account, select a service, and choose a date and time that works for you.',
  },
  {
    question: 'How is the price determined?',
    answer: 'Pricing is based on the service you select and details about your space such as property type, number of bedrooms, and bathrooms. You can get an estimate using our free quote tool.',
  },
  {
    question: 'Do I need to create an account to book?',
    answer: 'Yes, creating an account allows you to manage your bookings, view their status, and update your contact information. Sign up is quick and free.',
  },
  {
    question: 'What if I need to cancel or reschedule?',
    answer: 'You can view and manage your bookings from your customer dashboard. Cancellation and rescheduling details will be shown there once your booking is confirmed.',
  },
];

export function HomePage() {
  const servicesState = useServices();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 to-white">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Professional cleaning services
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-secondary-900 sm:text-5xl lg:text-6xl">
              A Cleaner Space. <br />
              <span className="text-primary-600">A Better Life.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-secondary-600">
              Cleanora provides reliable, professional cleaning services for homes, offices, and
              move-in/move-out situations. Book online in minutes and enjoy a spotless space.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton to="/book" size="lg">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                Book a Service
              </LinkButton>
              <LinkButton to="/quote" variant="outline" size="lg">
                Get a Free Quote
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </LinkButton>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="overflow-hidden rounded-3xl shadow-elevated">
              <img
                src={heroImage}
                alt="A bright, clean modern living room with sunlight streaming through large windows"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-secondary-200 bg-white p-5 shadow-card sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-secondary-900">Vetted professionals</p>
                  <p className="text-xs text-secondary-500">Trained and reliable teams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {trustFeatures.map((f) => (
            <Card key={f.title} className="p-6 transition-shadow hover:shadow-elevated">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <f.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-secondary-900">{f.title}</h3>
              <p className="mt-2 text-sm text-secondary-600">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Services section */}
      <section className="bg-secondary-100/60 py-16 lg:py-20" aria-labelledby="services-heading">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 id="services-heading" className="text-3xl font-bold text-secondary-900 sm:text-4xl">
                Our Services
              </h2>
              <p className="mt-3 max-w-lg text-secondary-600">
                Explore our range of professional cleaning services designed for your space.
              </p>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all services
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10">
            {servicesState.status === 'loading' && <LoadingState label="Loading services…" />}
            {servicesState.status === 'error' && (
              <ErrorState
                title="Couldn't load services"
                description={servicesState.message}
              />
            )}
            {servicesState.status === 'success' && servicesState.services.length === 0 && (
              <EmptyState
                icon={Sparkles}
                title="Our services are being prepared"
                description="Please check back soon for our full list of cleaning services."
                action={<LinkButton to="/contact" variant="outline">Contact us for details</LinkButton>}
              />
            )}
            {servicesState.status === 'success' && servicesState.services.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {servicesState.services.map((service) => (
                  <Link key={service.id} to={`/services/${service.slug}`} className="group">
                    <Card className="h-full overflow-hidden transition-all hover:shadow-elevated hover:-translate-y-0.5">
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
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600">
                          {service.name}
                        </h3>
                        <p className="mt-2 text-sm text-secondary-600 line-clamp-2">
                          {service.short_description ?? service.description ?? ''}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary-700">
                            From ${Number(service.starting_price).toFixed(0)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-secondary-500 group-hover:text-primary-600">
                            Learn more
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 lg:py-20" aria-labelledby="how-heading">
        <div className="text-center">
          <h2 id="how-heading" className="text-3xl font-bold text-secondary-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-secondary-600">Three simple steps to a cleaner space.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {howItWorks.map((step) => (
            <div key={step.step} className="relative text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-soft">
                <step.icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <span className="mt-4 block text-sm font-bold text-primary-300">{step.step}</span>
              <h3 className="mt-1 text-lg font-semibold text-secondary-900">{step.title}</h3>
              <p className="mt-2 text-sm text-secondary-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Service types */}
      <section className="bg-secondary-100/60 py-16 lg:py-20">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-secondary-900 sm:text-4xl">Spaces We Clean</h2>
          <p className="mt-3 text-secondary-600">Professional cleaning tailored to your environment.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {serviceTypeIcons.map((item) => (
              <Card key={item.label} className="flex flex-col items-center gap-3 p-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <item.icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="text-base font-semibold text-secondary-900">{item.label}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="container-page py-16 lg:py-20">
        <div className="overflow-hidden rounded-3xl bg-primary-700 px-8 py-14 text-center shadow-elevated sm:px-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready for a cleaner space?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-100">
            Book a professional cleaning service online in just a few minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton to="/book" variant="secondary" size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              Book a Service
            </LinkButton>
            <LinkButton to="/quote" size="lg" className="border border-white/30 bg-transparent text-white hover:bg-white/10">
              Get a Free Quote
            </LinkButton>
          </div>
        </div>
      </section>

      <FAQ items={faqItems} />
    </>
  );
}
