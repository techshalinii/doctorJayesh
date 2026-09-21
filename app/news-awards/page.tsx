import type { Metadata } from "next";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/ui/cta-band";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { VideoEmbed } from "@/components/ui/video-embed";
import { AwardsGallery } from "@/components/awards-gallery";
import { doctor, pressCoverage, newsItems, videos } from "@/lib/data";

const doc = getDocByFileSlug("news-awards")!;

export const metadata: Metadata = metadataFromDoc(doc);

export default function AwardsPage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <PageHero
        eyebrow="Awards & Recognition"
        breadcrumb="Awards"
        title="Recognised for excellence"
        description="A career shaped by national awards, gold medals, research honours and leadership within India's neurosurgical community."
      />

      {/* Award photographs — the Elementor image carousel that used to sit on the
          homepage (live WordPress section 5). Relocated here on 2026-09-04: it was
          the third awards touchpoint on `/`, and this is the awards page. Same
          images, unchanged. See _migration/PAGE-REBUILD.md §6.

          The default `pb-12 lg:pb-14` carries no TOP padding: the gallery used to sit
          under the leadership band, which supplied the gap. With the metrics strip,
          the honours timeline and that band removed, the gallery now follows the hero
          directly and its eyebrow would butt straight against the hero's bottom border,
          so the same value is applied on both sides. Images, order and captions are
          untouched. */}
      <AwardsGallery className="py-12 lg:py-14" />

      {/* ── News ──────────────────────────────────────────────────────────────
          Migrated from the live /news-awards/ page. The template had no press
          section at all — see _migration/PAGE-REBUILD.md §6. */}
      <section className="border-t border-border py-14 lg:py-18">
        <Container>
          <SectionHeading
            eyebrow="News"
            title="In the press"
            description="Coverage of the practice, the Fortis Institute of Minimally Invasive Brain & Spine Surgery, and Dr. Sardhara's work in national and medical media."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {pressCoverage.map((item, i) => (
              <Reveal key={`${item.outlet}-${i}`} delay={(i % 5) * 0.04}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col border border-navy-900/10 bg-surface-2 transition-colors hover:border-teal-500/60 dark:border-white/10"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={`${item.outlet} coverage of ${doctor.name}`}
                      fill
                      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 90vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <span className="px-3 py-3 text-xs uppercase tracking-wider text-muted transition-colors group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    {item.outlet}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            {newsItems.map((n, i) => (
              <Reveal key={n.title} delay={i * 0.06}>
                <article className="flex h-full flex-col">
                  {n.image && (
                    <div className="relative mb-6 aspect-[16/10] overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10">
                      <Image
                        src={n.image}
                        alt={n.title}
                        fill
                        sizes="(min-width: 1024px) 30vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-display text-xl font-medium leading-snug text-navy-900 dark:text-white">
                    {n.title}
                  </h3>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                    {n.paragraphs.map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Videos migrated from the live /news-awards/ page. */}
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {videos["news-awards"].map((v) => (
              <Reveal key={v.id}>
                <VideoEmbed video={v} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
