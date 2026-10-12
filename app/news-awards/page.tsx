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

      <AwardsGallery className="py-12 lg:py-14" />

      <section className="border-t border-border py-14 lg:py-18">
        <Container>
          <SectionHeading
            eyebrow="News"
            title="In the press"
            description="Coverage of the practice, the Fortis Institute of Minimally Invasive Brain & Spine Surgery, and Dr. Sardhara's work in national and medical media."
          />

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
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

          <div className="mt-16 space-y-6">
            {newsItems.map((n, i) => (
              <Reveal key={n.title} delay={0.04}>
                <article className="grid items-center gap-6 rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-100 sm:p-6 lg:grid-cols-12 lg:gap-10 lg:p-8 dark:bg-white/5 dark:ring-white/10">
                  {n.image && (
                    <div
                      className={`relative aspect-[3/2] overflow-hidden rounded-2xl bg-surface-2 lg:col-span-5 ${
                        i % 2 === 1 ? "lg:order-2" : ""
                      }`}
                    >
                      <Image
                        src={n.image}
                        alt={n.title}
                        fill
                        sizes="(min-width: 1024px) 38vw, 92vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className={n.image ? "lg:col-span-7" : "lg:col-span-12"}>
                    <h3 className="font-display text-2xl font-medium leading-snug text-navy-900 dark:text-white">
                      {n.title}
                    </h3>
                    <div className="mt-4 space-y-3 leading-relaxed text-muted">
                      {n.paragraphs.map((para, j) => (
                        <p key={j}>{para}</p>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-8 lg:flex-row lg:items-start">
            {videos["news-awards"].map((v) => (
              <Reveal
                key={v.id}
                className={
                  v.platform === "youtube-shorts"
                    ? "mx-auto w-full max-w-[17rem] shrink-0 lg:mx-0"
                    : "min-w-0 flex-1"
                }
              >
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
