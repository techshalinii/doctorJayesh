import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { ArrowUpRight, CalendarCheck, Clock, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow } from "@/components/ui/section-heading";
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

const card =
  "rounded-3xl bg-white shadow-card ring-1 ring-navy-100 dark:bg-white/5 dark:ring-white/10";
const badge =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-white/10 dark:text-teal-300";

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

      <section className="py-14 lg:py-18">
        <Container className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="order-2 lg:order-1 lg:col-span-7">
            <div className={`${card} p-6 sm:p-10`}>
              <div className="flex items-center gap-4">
                <span className={badge}>
                  <CalendarCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-medium text-navy-900 dark:text-white">Appointment request</h2>
                  <p className="mt-0.5 text-sm text-muted">
                    Secure &amp; confidential — we&apos;ll confirm within a few hours.
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-navy-900/10 pt-8 dark:border-white/10">
                <AppointmentForm />
              </div>
            </div>
          </Reveal>

          <aside className="order-1 flex flex-col gap-4 lg:sticky lg:top-28 lg:order-2 lg:col-span-5">
            <a
              href={`tel:${doctor.phoneRaw}`}
              className="group flex items-center gap-4 rounded-3xl bg-navy-900 p-6 text-white shadow-card transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft dark:bg-navy-950 dark:ring-1 dark:ring-white/10"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-teal-200">
                <Phone className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs uppercase tracking-wider text-white/60">Emergency / Direct line</span>
                <span className="mt-0.5 block font-display text-2xl font-medium">{doctor.phone}</span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="h-5 w-5 shrink-0 text-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>

            <div className={`${card} divide-y divide-navy-900/10 px-5 dark:divide-white/10`}>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 py-4 text-sm font-medium text-navy-900 transition-colors hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
              >
                <span className={badge}>
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1">Message on WhatsApp</span>
                <ArrowUpRight aria-hidden className="h-4 w-4 text-muted transition-colors group-hover:text-teal-700" />
              </a>
              <div className="flex items-center gap-4 py-4">
                <span className={badge}>
                  <Clock className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-medium uppercase tracking-wider text-muted">OPD</span>
                  <span className="block text-sm font-semibold text-navy-900 dark:text-white">{doctor.opd}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5 rounded-3xl bg-navy-50 p-6 ring-1 ring-navy-100 dark:bg-white/4 dark:ring-white/10">
              {locations.map((l) => (
                <div key={l.name} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 ring-1 ring-navy-100 dark:bg-white/10 dark:text-teal-300 dark:ring-white/10">
                    <MapPin className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium text-navy-900 dark:text-white">{l.name}</p>
                    <p className="text-sm text-muted">{l.address}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 px-2 pt-1">
              <ShieldCheck className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
              <p className="text-sm text-muted">
                Your information is kept strictly confidential and used only to arrange your care.
              </p>
            </div>
          </aside>
        </Container>
      </section>

      <section className="-mb-24 border-t border-border bg-surface/50 py-14 lg:py-18">
        <Container>
          <Eyebrow>How it works</Eyebrow>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.08} className={`${card} h-full p-7`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-medium tabular-nums text-white dark:bg-white dark:text-navy-950">
                  {s.n}
                </span>
                <h3 className="mt-5 font-display text-lg font-medium text-navy-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </Reveal>
            ))}
          </ol>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {trustStats.map((s) => (
              <div key={s.label} className={`${card} p-5`}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-2xl font-medium tracking-tight text-navy-900 dark:text-white">{s.value}</dd>
                <dd aria-hidden className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </>
  );
}
