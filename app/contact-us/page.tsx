import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { doctor, locations } from "@/lib/data";

export const metadata: Metadata = pageMetadata({
  path: "/contact-us",
  title: "Contact",
  description: `Contact ${doctor.name} — clinic locations in Mumbai, phone, email and WhatsApp. OPD ${doctor.opd}.`,
});

export default function ContactPage() {
  const wa = `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent("Hello, I'd like to book a consultation.")}`;

  const rows = [
    { icon: Phone, label: "Call / Emergency", value: doctor.phone, href: `tel:${doctor.phoneRaw}` },
    { icon: MessageCircle, label: "WhatsApp", value: "Chat with our team", href: wa },
    { icon: Mail, label: "Email", value: doctor.email, href: `mailto:${doctor.email}` },
    { icon: Clock, label: "OPD Hours", value: doctor.opd },
  ];

  return (
    <>
      {/* This route has no WordPress capture behind it, so there is no StoredJsonLd to
          render and it was shipping with no structured data at all. The Physician entity
          is the right one here: every property it claims — name, phone, email, the two
          clinic addresses — is visibly rendered on this page. */}
      <JsonLd />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact-us" },
        ]}
      />
      <PageHero
        eyebrow="Get in Touch"
        breadcrumb="Contact"
        title="Contact & appointments"
        description="Reach out by phone, WhatsApp or the form below. For emergencies, please call us directly."
      />

      <section className="py-14 lg:py-20">
        <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* left column */}
          <div className="lg:col-span-5">
            <div className="border-t border-navy-900/12 dark:border-white/12">
              {rows.map((r) => {
                const Row = (
                  <>
                    <span className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
                      <r.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" /> {r.label}
                    </span>
                    <span className="mt-1 block font-display text-lg font-medium text-navy-900 dark:text-white">
                      {r.value}
                    </span>
                  </>
                );
                return r.href ? (
                  <a
                    key={r.label}
                    href={r.href}
                    target={r.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block border-b border-navy-900/12 py-5 transition-colors hover:text-teal-700 dark:border-white/12"
                  >
                    {Row}
                  </a>
                ) : (
                  <div key={r.label} className="border-b border-navy-900/12 py-5 dark:border-white/12">
                    {Row}
                  </div>
                );
              })}
            </div>

            <h2 className="mt-12 font-display text-xl font-medium text-navy-900 dark:text-white">Clinic locations</h2>
            <div className="mt-5 space-y-6">
              {locations.map((l) => (
                <div key={l.name} className="flex items-start gap-4">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                  <div>
                    <span className="text-xs uppercase tracking-wider text-teal-700 dark:text-teal-300">{l.kind}</span>
                    <h3 className="mt-0.5 font-medium text-navy-900 dark:text-white">{l.name}</h3>
                    <p className="mt-1 text-sm text-muted">{l.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* form */}
          <Reveal className="lg:col-span-7">
            <div className="border border-navy-900/10 p-8 sm:p-10 dark:border-white/10">
              <h2 className="font-display text-2xl font-medium text-navy-900 dark:text-white">Send us a message</h2>
              <p className="mt-1.5 text-sm text-muted">We&apos;ll get back to you within a few hours.</p>
              <div className="mt-8">
                <AppointmentForm />
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
