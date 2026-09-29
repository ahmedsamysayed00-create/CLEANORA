import { Sparkles, ShieldCheck, Heart, Leaf, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';

const values = [
  {
    icon: ShieldCheck,
    title: 'Reliability',
    description: 'We show up on time and deliver consistent results every visit.',
  },
  {
    icon: Heart,
    title: 'Care',
    description: 'We treat your space with the same respect we would our own.',
  },
  {
    icon: Leaf,
    title: 'Responsibility',
    description: 'We use thoughtful cleaning practices that are safe for your space.',
  },
  {
    icon: Users,
    title: 'People First',
    description: 'Our team is trained, vetted, and committed to your satisfaction.',
  },
];

export function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50/60 to-white">
        <div className="container-page py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              About Cleanora
            </span>
            <h1 className="mt-4 text-4xl font-bold text-secondary-900 sm:text-5xl">
              Professional cleaning you can trust
            </h1>
            <p className="mt-6 text-lg text-secondary-600">
              Cleanora is a professional cleaning services company focused on delivering reliable,
              high-quality cleaning for homes, offices, and move-in/move-out situations. We believe a
              cleaner space leads to a better, more productive life.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-secondary-900">Our mission</h2>
            <p className="mt-4 text-secondary-600">
              Our mission is simple: to make professional cleaning accessible, reliable, and
              stress-free. We handle the details so you can focus on what matters most to you.
            </p>
            <p className="mt-4 text-secondary-600">
              Whether you need a one-time deep clean, regular home cleaning, or help with a move,
              Cleanora connects you with trained professionals who take pride in their work.
            </p>
            <div className="mt-8">
              <LinkButton to="/book" size="lg">Book a Service</LinkButton>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <Card key={v.title} className="p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <v.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-secondary-900">{v.title}</h3>
                <p className="mt-2 text-sm text-secondary-600">{v.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary-100/60 py-16 lg:py-20">
        <div className="container-page mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-secondary-900">Built on trust</h2>
          <p className="mt-4 text-secondary-600">
            We are committed to transparency and honesty. We do not make claims we cannot back up.
            Instead, we let our work speak for itself, one clean space at a time.
          </p>
          <div className="mt-8">
            <LinkButton to="/contact" variant="outline" size="lg">Get in touch</LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
