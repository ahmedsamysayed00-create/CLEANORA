import { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Label, FieldError } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!form.email.trim()) e.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email.';
    if (!form.message.trim()) e.message = 'Please enter a message.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    // Contact form submission will be wired to a backend in a later phase.
    setSubmitted(true);
  };

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Contact
        </span>
        <h1 className="mt-4 text-4xl font-bold text-secondary-900 sm:text-5xl">Get in touch</h1>
        <p className="mt-4 text-lg text-secondary-600">
          Have a question or special request? Send us a message and we will get back to you.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <Card className="p-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-100 text-success-600">
                <Mail className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-semibold text-secondary-900">Message received</h2>
              <p className="text-sm text-secondary-500">
                Thank you for reaching out. We will respond to your message as soon as possible.
              </p>
              <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  aria-invalid={!!errors.name}
                />
                <FieldError>{errors.name}</FieldError>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email}</FieldError>
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  aria-invalid={!!errors.message}
                />
                <FieldError>{errors.message}</FieldError>
              </div>
              <Button type="submit" size="lg" className="w-full">
                <Send className="h-4 w-4" aria-hidden="true" />
                Send message
              </Button>
            </form>
          )}
        </Card>
        <p className="mt-6 text-center text-sm text-secondary-400">
          Contact details such as phone and email will appear here once configured.
        </p>
      </div>
    </div>
  );
}
