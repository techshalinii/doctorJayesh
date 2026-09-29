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
        <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {aboutExpertise.map((e) => (
            <Reveal key={e.slug}>
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-white/10 dark:text-teal-300">
                  <Icon name={e.icon} className="h-5 w-5" />
                </span>
                <h3 className="font-display text-xl font-medium text-navy-900 dark:text-white">
                  {e.longTitle ?? e.title}
                </h3>
              </div>
              <p className="mt-3 leading-relaxed text-muted">{e.long}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
