import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { awards, doctor } from "@/lib/data";

const metrics = [
  { value: `${doctor.publications}`, label: "Publications" },
  { value: `0${doctor.books}`, label: "Books" },
  { value: `0${doctor.patents}`, label: "Patent" },
];

export function Awards() {
  return (
    <section className="py-16 lg:py-24" id="awards">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        {/* left intro + metrics */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            {/* "Honours and Awards" is the live WordPress section 9 heading, verbatim. */}
            <SectionHeading index="04" eyebrow="Awards & Recognition" title="Honours and Awards" />
            <p className="mt-5 leading-relaxed text-muted">
              National awards, gold medals and international honours — reflecting a commitment to surgical excellence and
              research.
            </p>
            <dl className="mt-8 flex gap-10 border-t border-navy-900/12 pt-6 dark:border-white/12">
              {metrics.map((m) => (
                <div key={m.label}>
                  <dt className="font-display text-3xl font-medium text-navy-900 dark:text-white">{m.value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{m.label}</dd>
                </div>
              ))}
            </dl>
            <Button href="/news-awards/" className="mt-8">
              All awards &amp; recognition
            </Button>
          </div>
        </div>

        {/* right timeline list */}
        <div className="lg:col-span-8">
          <div className="border-t border-navy-900/12 dark:border-white/12">
            {/* Teaser: 4 of 10. The full list is at /news-awards/, linked above. */}
            {awards.slice(0, 4).map((a, i) => (
              <Reveal key={a.title} delay={(i % 6) * 0.05}>
                {/* Three tracks from sm up: a fixed 5rem year, the title taking every
                    remaining pixel, and the category/location sized to its own content and
                    pushed to the right edge.

                    The row was already the full width of the column — nothing was capping
                    it — but with the meta stacked under the title, a ~320px title left
                    ~550px of trailing whitespace inside an 869px track. Moving the meta out
                    to its own right-aligned track makes the row read edge to edge without
                    stretching or re-wrapping any of the text.

                    Below sm it collapses back to one column, so the stacked mobile layout
                    and the existing py-6 rhythm are unchanged. */}
                <div className="grid grid-cols-1 gap-x-8 gap-y-1 border-b border-navy-900/12 py-6 dark:border-white/12 sm:grid-cols-[5rem_1fr_auto] sm:items-baseline">
                  <span className="font-display text-lg font-medium tabular-nums text-teal-700/70 dark:text-teal-300/70">
                    {a.year}
                  </span>
                  <h3 className="font-display text-lg font-medium text-navy-900 dark:text-white">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted sm:mt-0 sm:whitespace-nowrap sm:text-right">
                    <span className="uppercase tracking-wider text-teal-700/80 dark:text-teal-300/80">{a.type}</span>
                    <span className="mx-2 text-navy-300 dark:text-white/30">·</span>
                    {a.org}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
