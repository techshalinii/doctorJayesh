import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Clock, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { doctor, locations, trustStats } from "@/lib/data";

export const metadata: Metadata = pageMetadata({
  path: "/appointment",
  title: "Book an Appointment",
  description: `Book an appointment with ${doctor.name}, ${doctor.title} in Mumbai. Call ${doctor.phone} or request a time online.`,
});

const steps = [
  { n: "01", title: "Request", desc: "Fill the form or call — tell us briefly about your concern." },
  { n: "02", title: "Confirm", desc: "Our care team calls you to confirm a convenient time." },
  { n: "03", title: "Consult", desc: "Meet the surgeon, review your imaging and get a clear plan." },
];

export default function AppointmentPage() {
  const wa = `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent("Hello, I'd like to book a consultation.")}`;

  return (
    <>
      <JsonLd />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", path: "/" },
          { name: "Appointment", path: "/appointment" },
        ]}
      />
      <PageHero
        eyebrow="Book an Appointment"
        breadcrumb="Appointment"
        title="Book your consultation"
        description="Take the first step toward expert brain and spine care. Request a time online, or reach us directly for urgent needs."
      />

      <section className="py-14 lg:py-20">
        <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="order-2 lg:order-1 lg:col-span-7">
            <div className="border border-navy-900/10 p-8 sm:p-10 dark:border-white/10">
              <h2 className="font-display text-2xl font-medium text-navy-900 dark:text-white">Appointment request</h2>
              <p className="mt-1.5 text-sm text-muted">Secure &amp; confidential — we&apos;ll confirm within a few hours.</p>
              <div className="mt-8">
                <AppointmentForm />
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <a
              href={`tel:${doctor.phoneRaw}`}
              className="block border-t-2 border-teal-500 bg-navy-900 p-6 text-white dark:bg-navy-950"
            >
              <span className="text-xs uppercase tracking-wider text-white/50">Emergency / Direct line</span>
              <span className="mt-1 flex items-center gap-2 font-display text-2xl font-medium">
                <Phone className="h-5 w-5 text-teal-300" /> {doctor.phone}
              </span>
            </a>

            <div className="mt-6 divide-y divide-navy-900/12 border-y border-navy-900/12 dark:divide-white/12 dark:border-white/12">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-4 text-sm font-medium text-navy-800 transition-colors hover:text-teal-700 dark:text-white/85">
                <MessageCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Message on WhatsApp
              </a>
              <div className="flex items-center gap-3 py-4 text-sm text-muted">
                <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" /> OPD · {doctor.opd}
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {locations.map((l) => (
                <div key={l.name} className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="font-medium text-navy-900 dark:text-white">{l.name}</p>
                    <p className="text-sm text-muted">{l.address}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-3 border-t border-navy-900/12 pt-6 dark:border-white/12">
              <ShieldCheck className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
              <p className="text-sm text-muted">
                Your information is kept strictly confidential and used only to arrange your care.
              </p>
            </div>
          </div>
        </Container>

        <Container className="mt-24">
          <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
            <span className="h-px w-8 bg-teal-600/50" /> How it works
          </span>
          <div className="mt-8 grid border-t border-navy-900/12 dark:border-white/12 sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className={`py-8 sm:px-8 ${i !== 0 ? "border-t border-navy-900/12 dark:border-white/12 sm:border-l sm:border-t-0" : ""}`}>
                  <span className="font-display text-4xl font-medium text-navy-200 dark:text-white/15">{s.n}</span>
                  <h3 className="mt-3 font-display text-lg font-medium text-navy-900 dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <dl className="mt-12 grid grid-cols-2 border-t border-navy-900/12 dark:border-white/12 sm:grid-cols-4">
            {trustStats.map((s, i) => (
              <div key={s.label} className={`py-7 ${i !== 0 ? "sm:border-l sm:border-navy-900/12 sm:pl-6 dark:sm:border-white/12" : ""} ${i % 2 !== 0 ? "border-l border-navy-900/12 pl-6 dark:border-white/12" : ""} ${i >= 2 ? "border-t border-navy-900/12 dark:border-white/12 sm:border-t-0" : ""}`}>
                <dt className="font-display text-2xl font-medium text-navy-900 dark:text-white">{s.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </>
  );
}
