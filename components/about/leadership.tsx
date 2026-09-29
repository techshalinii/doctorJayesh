import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { doctor } from "@/lib/data";

export function AboutLeadership() {
  return (
    <section className="border-t border-border bg-surface/50 py-14 lg:py-18">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative aspect-[3/2] overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10">
              <Image
                src="/images/clinic-fortis-mulund.jpg"
                alt="Dr. Jayesh Sardhara at the Advanced Skull Base Surgery conference, Fortis Hospital Mumbai"
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              <span className="h-px w-8 bg-teal-600/50" /> Leadership & the Profession
            </span>
            <h2 className="mt-5 font-display text-[2rem] font-medium leading-tight text-navy-900 dark:text-white">
              Advancing brain &amp; spine surgery in India
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              {doctor.shortName} organises and leads national CME programmes and cadaveric workshops — including advanced
              skull-base and endoscopic surgery training at Fortis Hospital, Mumbai — helping shape the next generation
              of neurosurgeons and bring modern, minimally invasive techniques to more patients.
            </p>
            <Button href="/news-awards/" variant="secondary" className="mt-8">
              News &amp; awards
            </Button>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
