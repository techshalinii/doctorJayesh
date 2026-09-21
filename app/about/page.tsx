import type { Metadata } from "next";
import { JsonLd, StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { DoctorPhoto } from "@/components/ui/doctor-photo";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/cta-band";
import { VideoEmbed } from "@/components/ui/video-embed";
import { doctor, affiliations, aboutVideo, awards, expertise, SURGERIES_TOTAL } from "@/lib/data";

const doc = getDocByFileSlug("about")!;

export const metadata: Metadata = metadataFromDoc(doc);

/**
 * The four "Areas of Expertise" entries the live /about/ page carried, in its document
 * order — which is not the order they sit in `expertise` (that array is ordered for the
 * homepage grid). Selected by slug rather than filtered on `long`, so adding migrated
 * copy to a fifth entry elsewhere cannot silently append a card to this page.
 */
const ABOUT_EXPERTISE_ORDER = [
  "brain-tumor-surgery",
  "endoscopic-skull-base",
  "minimally-invasive-spine",
  "pediatric-neurosurgery",
] as const;

const aboutExpertise = ABOUT_EXPERTISE_ORDER.map(
  (slug) => expertise.find((e) => e.slug === slug)!,
);

const stats = [
  { value: SURGERIES_TOTAL, label: "Surgeries Performed" },
  { value: `${doctor.publications}`, label: "Publications" },
  { value: `0${doctor.books}`, label: "Books Authored" },
  { value: `0${doctor.patents}`, label: "Patent Held" },
];

const timeline = [
  { year: "—", title: "MBBS & MS", desc: "Foundational medical and surgical training with distinction." },
  { year: "2014", title: "MCh in Neurosurgery", desc: "Advanced neurosurgical specialisation — awarded the Prof. R. K. Sharma Gold Medal." },
  { year: "—", title: "International Fellowships", desc: "Focused training in endoscopic and minimally invasive brain & spine surgery." },
  { year: "2016", title: "Best Young Neurosurgeon of India", desc: "National recognition for surgical excellence and research." },
  { year: "Present", title: "Leadership at NSI", desc: "Chairman of the Young Neurosurgical Forum and Innovation & Patent Cell." },
];

const philosophy = [
  "Honest counselling — surgery only when it's truly the best option.",
  "Minimally invasive first, to protect healthy tissue and speed recovery.",
  "Technology-led precision with intra-operative monitoring and navigation.",
  "Care that treats the whole person and their family, not just the scan.",
];

export default function AboutPage() {
  return (
    <>
      {/* Stored capture plus the Physician entity it lacks — see components/seo/json-ld.tsx. */}
      <StoredJsonLd schema={doc.schema} />
      <JsonLd />
      <PageHero
        eyebrow="About Dr. Jayesh Sardhara"
        breadcrumb="About"
        title={<>Dr Jayesh Sardhara&rsquo;s Neuro Clinic</>}
        description={`${doctor.credentials} · ${doctor.role}. Over ${doctor.experienceYears} years of experience and ${SURGERIES_TOTAL} brain and spine procedures.`}
      >
        <div className="flex flex-wrap gap-4">
          <Button href="/appointment/">Book a Consultation</Button>
          <Button href="/news-awards/" variant="secondary">View Awards</Button>
        </div>
      </PageHero>

      {/* biography */}
      <section className="py-14 lg:py-20">
        <Container className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="border border-navy-900/10 p-2 dark:border-white/10">
              <DoctorPhoto className="aspect-[4/5] w-full" priority />
            </div>
            <dl className="mt-6 grid grid-cols-2">
              {stats.map((s, i) => (
                <div key={s.label} className={`py-5 ${i % 2 !== 0 ? "border-l border-navy-900/12 pl-5 dark:border-white/12" : ""} ${i >= 2 ? "border-t border-navy-900/12 dark:border-white/12" : ""}`}>
                  <dt className="font-display text-2xl font-medium text-navy-900 dark:text-white">{s.value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="lg:col-span-7">
            <SectionHeading eyebrow="Biography" title="A surgeon at the frontier of neuro & spine care" />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                {doctor.name} is a distinguished neurosurgeon and spine surgeon based in Mumbai, serving as{" "}
                {doctor.role.toLowerCase()}. With more than {doctor.experienceYears} years of experience, he has performed
                over {doctor.brainSurgeries}+ brain tumor surgeries and {doctor.spineSurgeries}+ spine surgeries.
              </p>
              <p>
                His practice is defined by a minimally invasive philosophy — endoscopic brain and spine surgery, keyhole
                approaches and deep brain stimulation — that consistently delivers smaller scars, less pain and faster
                recovery for his patients.
              </p>
              <p>
                A prolific academic, he has authored {doctor.publications}{" "}
                peer-reviewed publications and two books, holds
                a patent, and chairs the Young Neurosurgical Forum and the Innovation &amp; Patent Cell at the
                Neurological Society of India.
              </p>
              {/* Migrated verbatim from the live /about/ page — see _migration/PAGE-REBUILD.md §2. */}
              <p>
                {doctor.name}, a highly experienced Senior Consultant in Neuro and Spine Surgery at Fortis Hospital,
                Mulund, boasts {doctor.experienceYears} years of expertise in minimally invasive endoscopic brain and
                spine surgeries. His credentials include an MBBS and MS in General Surgery from MPSMC, Saurashtra
                University, Gujarat, and an M.Ch. in Neurosurgery from SGPGIMS, Lucknow. {doctor.shortName}{" "}
                underwent
                comprehensive training in minimally invasive spine surgery techniques in Japan and South Korea. He is
                renowned for his research in craniovertebral junction spine surgery and complex spine deformity surgery,
                earning him accolades like the &ldquo;Best Young Neurosurgeon India&rdquo; award in 2016. With{" "}
                {doctor.publications} research publications, editorial roles, a patent, and active involvement in medical
                societies, he is a respected leader in his field.
              </p>
            </div>

            {/* milestones */}
            <h3 className="mt-12 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              Training &amp; Career Milestones
            </h3>
            {/* Rows stack below `sm`. At base the fixed 4.5rem year column plus gap-x-6
                ate 96px of the 280px available at 320px, leaving 184px for the title and
                description. The Honours list further down this same page already uses
                `sm:grid-cols-[5rem_1fr_auto]` for exactly this reason; this row was the
                one that did not. Desktop is unchanged — the two-column layout still
                applies from 640px up. */}
            <div className="mt-6 border-t border-navy-900/12 dark:border-white/12">
              {timeline.map((t) => (
                <div key={t.title} className="grid gap-x-6 border-b border-navy-900/12 py-5 dark:border-white/12 sm:grid-cols-[4.5rem_1fr]">
                  <span className="font-display text-sm font-medium tabular-nums text-teal-700/70 dark:text-teal-300/70">{t.year}</span>
                  <div>
                    <h4 className="font-display text-lg font-medium text-navy-900 dark:text-white">{t.title}</h4>
                    <p className="mt-1 text-sm text-muted">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* philosophy */}
            <h3 className="mt-12 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              Care Philosophy
            </h3>
            <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
              {philosophy.map((p) => (
                <li key={p} className="flex items-start gap-3 border-t border-navy-900/12 py-4 text-sm text-muted dark:border-white/12">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  {p}
                </li>
              ))}
            </ul>

            {/* affiliations */}
            <h3 className="mt-12 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              Hospital Affiliations
            </h3>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
              {affiliations.map((a) => (
                <span key={a} className="text-sm font-medium text-navy-800 dark:text-white/80">{a}</span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* leadership / conference image */}
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

      {/* Areas of Expertise — long-form copy migrated from the live /about/ page.
          See _migration/PAGE-REBUILD.md §2. */}
      <section className="py-14 lg:py-18">
        <Container>
          <SectionHeading eyebrow="Expertise" title="Areas of Expertise" />
          <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-2">
            {aboutExpertise.map((e) => (
              <Reveal key={e.slug}>
                <h3 className="font-display text-xl font-medium text-navy-900 dark:text-white">
                  {e.longTitle ?? e.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted">{e.long}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Honours and Awards — the live /about/ page carried this list and ours did not.
          Rendered from the shared `awards` data so /about/ and /news-awards/ stay in step. */}
      <section className="border-t border-border py-14 lg:py-18">
        <Container>
          <SectionHeading eyebrow="Recognition" title="Honours and Awards" />
          <ul className="mt-10 border-t border-navy-900/12 dark:border-white/12">
            {awards.map((a) => (
              <li
                key={`${a.year}-${a.title}`}
                className="grid gap-x-6 gap-y-1 border-b border-navy-900/12 py-5 sm:grid-cols-[5rem_1fr_auto] dark:border-white/12"
              >
                <span className="font-display text-sm font-medium tabular-nums text-teal-700/70 dark:text-teal-300/70">
                  {a.year}
                </span>
                <span className="font-display text-lg font-medium leading-snug text-navy-900 dark:text-white">
                  {a.title}
                  <span className="block text-sm font-normal text-muted">{a.org}</span>
                </span>
                <span className="text-xs uppercase tracking-wider text-muted sm:text-right">{a.type}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Introduction video and the migrated certificate, paired in one row.
          The video is 16:9 and the certificate is portrait, so side by side they fill the
          band that the video alone left half empty on wide screens. Both columns keep
          their own eyebrow + heading, so each is still a titled subsection rather than one
          heading spanning two unrelated things.

          `aria-label` on each column rather than `aria-labelledby`: SectionHeading renders
          the <h2> and takes no `id`, and it is shared by every page on the site — labelling
          here avoids reaching into a component this change has no business touching. */}
      <section className="border-t border-border py-14 lg:py-18">
        <Container>
          <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
            <section aria-label="About Jayesh Sardhara" className="lg:col-span-7">
              <SectionHeading eyebrow="Video" title="About Jayesh Sardhara" />
              {/* VideoEmbed handles the rest: real poster from YouTube's thumbnail CDN,
                  centred play button, and the iframe is only mounted on click. */}
              <Reveal className="mt-10">
                <VideoEmbed video={aboutVideo} />
              </Reveal>
            </section>

            <section aria-label="Certificates" className="lg:col-span-5">
              <SectionHeading eyebrow="Certificates" title="Credentials on record" />
              {/* Capped at 22rem so the portrait scan lands at roughly the video's height
                  instead of towering over it.

                  `sizes` MUST track that cap. The source is 2480x3509, but with a `sizes`
                  hint next/image picks the srcset candidate from the rendered width — the
                  old `20rem` was written for the 20rem box this used to sit in, and leaving
                  it here would have the browser fetch a narrower file than the box it now
                  fills and upscale it. This is the one line that keeps the scan sharp. */}
              <Reveal className="mt-10 max-w-[22rem]">
                <div className="relative aspect-[212/300] overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10">
                  <Image
                    src="/wp-content/uploads/2024/02/DOC-20240220-WA0052_240220_202124.jpg"
                    alt={`Certificate awarded to ${doctor.name}`}
                    fill
                    sizes="(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 90vw"
                    className="object-contain"
                  />
                </div>
              </Reveal>
            </section>
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
