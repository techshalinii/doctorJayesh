import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { awards } from "@/lib/data";

type Award = (typeof awards)[number];

const years = awards.map((a) => Number(a.year)).filter(Number.isFinite);
const earliest = years.length ? Math.min(...years) : null;
const hasCurrent = awards.some((a) => a.year === "Present");

function AwardRow({ award }: { award: Award }) {
  return (
    <li className="group relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1.5 border-b border-navy-900/12 px-3 py-4 transition-colors duration-300 ease-out hover:bg-navy-50 sm:px-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_5rem] lg:items-baseline lg:gap-x-8 lg:py-5 dark:border-white/12 dark:hover:bg-white/[0.04]">
      <h3 className="col-start-1 row-start-1 font-display text-lg font-medium leading-snug text-foreground transition-[color,translate] duration-300 ease-out group-hover:text-navy-900 motion-safe:group-hover:translate-x-1 dark:group-hover:text-teal-200">
        {award.title}
      </h3>

      <div className="col-span-2 col-start-1 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
        <p className="text-sm font-medium text-foreground/80">{award.org}</p>
        <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
          {award.type}
        </p>
      </div>

      <span className="col-start-2 row-start-1 pt-1 text-right text-sm tabular-nums text-muted lg:col-start-3 lg:pt-0">
        {award.year}
      </span>
    </li>
  );
}

export function AboutAwards() {
  return (
    <section className="border-t border-border bg-surface/60 py-14 lg:py-18">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow="Recognition" title="Honours and Awards" />
          
        </div>

        <div
          aria-hidden
          className="mt-10 hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_5rem] gap-x-8 px-4 pb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted lg:grid"
        >
          <span>Recognition</span>
          <span>Awarded by</span>
          <span className="text-right">Year</span>
        </div>

        <ul className="mt-8 border-t border-navy-900/20 lg:mt-0 dark:border-white/20">
          {awards.map((award) => (
            <AwardRow key={`${award.year}-${award.title}`} award={award} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
