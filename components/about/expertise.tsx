import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { expertise } from "@/lib/data";

const ABOUT_EXPERTISE_ORDER = [
  "brain-tumor-surgery",
  "endoscopic-skull-base",
  "minimally-invasive-spine",
  "pediatric-neurosurgery",
] as const;

const aboutExpertise = ABOUT_EXPERTISE_ORDER.map(
  (slug) => expertise.find((e) => e.slug === slug)!,
);

export function AboutExpertise() {
  return (
    <section className="py-14 lg:py-18">
      <Container>
        <SectionHeading eyebrow="Expertise" title="Areas of Expertise" />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {aboutExpertise.map((e, i) => (
            <Reveal key={e.slug} delay={(i % 2) * 0.06} className="h-full">
              <article className="group flex h-full flex-col rounded-3xl bg-white p-7 shadow-card ring-1 ring-navy-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft hover:ring-navy-200 sm:p-8 dark:bg-white/5 dark:ring-white/10">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-colors duration-300 group-hover:bg-navy-900 group-hover:text-white dark:bg-white/10 dark:text-teal-300">
                    <Icon name={e.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl font-medium leading-snug text-navy-900 dark:text-white">
                    {e.longTitle ?? e.title}
                  </h3>
                </div>
                <p className="mt-5 pt-5 text-[0.95rem] leading-relaxed text-muted ">
                  {e.long}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
