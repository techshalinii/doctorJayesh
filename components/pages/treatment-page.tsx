import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/ui/cta-band";
import { Faq } from "@/components/ui/faq";
import type { TreatmentData } from "@/lib/treatments";
import { VideoEmbed } from "@/components/ui/video-embed";
import { videos } from "@/lib/data";

export function TreatmentPage({ data }: { data: TreatmentData }) {
  return (
    <>
      <PageHero eyebrow={data.eyebrow} breadcrumb={data.eyebrow} title={data.title} description={data.description}>
        <div className="flex flex-wrap gap-4">
          <Button href="/appointment/">Book a Consultation <ArrowRight className="h-4 w-4" /></Button>
          <Button href="/conditions/" variant="secondary">Conditions We Treat</Button>
        </div>
      </PageHero>

      <Container className="mt-12">
        <div className="relative aspect-[21/8] overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10">
          <Image
            src={data.image}
            alt={`${data.title} — illustration`}
            fill
            priority
            sizes="(min-width: 1280px) 72rem, 100vw"
            className="object-cover"
          />
        </div>
      </Container>

      {/* intro + benefits */}
      <section className="py-16 lg:py-24">
        <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionHeading index="01" eyebrow="Overview" title="A precise, minimally invasive approach" />
            <p className="mt-6 text-lg leading-relaxed text-muted">{data.intro}</p>
            <div className="mt-10 grid sm:grid-cols-2">
              {data.benefits.map((b, i) => (
                <Reveal key={b.title} delay={(i % 2) * 0.06}>
                  <div className={`border-t border-navy-900/12 py-7 dark:border-white/12 ${i % 2 === 1 ? "sm:border-l sm:pl-8" : ""}`}>
                    <Icon name={b.icon} className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    <h3 className="mt-4 font-display text-lg font-medium text-navy-900 dark:text-white">{b.title}</h3>
                    <p className="mt-1.5 text-sm text-muted">{b.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* conditions panel */}
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="border border-navy-900/10 p-8 dark:border-white/10 lg:sticky lg:top-28">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
                Conditions Treated
              </span>
              <ul className="mt-6">
                {data.conditions.map((c) => (
                  <li key={c} className="border-b border-border py-3 text-sm font-medium text-navy-800 last:border-b-0 dark:text-white/85">
                    {c}
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-navy-900/12 pt-6 dark:border-white/12">
                <p className="text-sm text-muted">Not sure if surgery is right for you?</p>
                <Button href="/appointment/" variant="primary" size="sm" className="mt-4">
                  Get an honest second opinion
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* procedures — index list */}
      <section className="border-y border-border bg-surface/50 py-16 lg:py-24">
        <Container>
          <SectionHeading
            index="02"
            eyebrow="Procedures"
            title="Procedures we perform"
            description={`A full range of ${data.eyebrow.toLowerCase()} procedures, tailored to your diagnosis.`}
          />
          <div className="mt-14 border-t border-navy-900/12 dark:border-white/12">
            {data.procedures.map((p, i) => (
              <Reveal key={p.name} delay={(i % 6) * 0.04}>
                <div className="grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-b border-navy-900/12 py-7 dark:border-white/12 sm:grid-cols-[3rem_1fr_auto]">
                  <span className="font-display text-lg font-medium tabular-nums text-teal-700/60 dark:text-teal-300/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-medium text-navy-900 dark:text-white">{p.name}</h3>
                    <p className="mt-1.5 max-w-xl text-sm text-muted">{p.desc}</p>
                  </div>
                  <Icon name={p.icon} className="hidden h-6 w-6 text-navy-300 dark:text-white/30 sm:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* faqs */}
      <section className="py-16 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading index="03" eyebrow="FAQ" title="Questions patients ask" />
          <Faq items={data.faqs} />
        </Container>
      </section>

      {videos[data.slug]?.length ? (
        <section className="border-t border-border py-14 lg:py-18">
          <Container>
            <SectionHeading eyebrow="Watch" title="Surgical technique" />
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {videos[data.slug].map((v) => (
                <VideoEmbed key={v.id} video={v} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <CtaBand />
    </>
  );
}
