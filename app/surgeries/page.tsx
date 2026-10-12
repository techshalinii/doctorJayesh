import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Arrow } from "@/components/ui/arrow";
import { CtaBand } from "@/components/ui/cta-band";

const doc = getDocByFileSlug("surgeries")!;

export const metadata: Metadata = metadataFromDoc(doc);

const UPLOADS = "/wp-content/uploads/2025/01";

const BANNERS = [
  { label: "Brain Surgery", href: "/brain-surgery/", image: `${UPLOADS}/1-1.png` },
  { label: "Spine Surgery", href: "/spine-surgery/", image: `${UPLOADS}/2-1.png` },
  { label: "Brain Tumor Surgery", href: "/brain-tumor/", image: `${UPLOADS}/2-1.png` },
];

const strong = "font-semibold text-navy-900 dark:text-white";

const SURGERIES: { title: string; intro: ReactNode; items?: string[]; outro?: ReactNode }[] = [
  {
    title: "1. Brain Surgery",
    intro:
      "When it comes to brain surgery, precision is everything. Dr. Sardhara specializes in treating conditions like brain tumours, head injuries, and neurological disorders. Common procedures include:",
    items: [
      "Brain Tumor Removal",
      "Craniotomy for Injuries",
      "Epilepsy Surgery",
      "Deep Brain Stimulation (DBS)",
      "Stroke Surgery",
      "Neurovascular Surgery",
    ],
    outro: "Using minimally invasive techniques, Dr. Sardhara ensures quicker recovery and better outcomes for his patients.",
  },
  {
    title: "2. Spine Surgery",
    intro:
      "Back and neck pain can make even the simplest tasks feel impossible. Dr. Sardhara is an expert in treating spinal problems like herniated discs, spinal stenosis, and deformities. His expertise includes:",
    items: [
      "Spinal Fusion",
      "Microdiscectomy",
      "Minimally Invasive Spine Surgery (MISS)",
      "Spinal Deformity Correction",
      "Chronic Pain & Nerve Compression Treatments",
      "Spinal Cord Injury Surgery",
    ],
    outro: (
      <>
        As one of the <strong className={strong}>best spine surgeons in Mumbai</strong>, Dr. Sardhara&rsquo;s approach
        focuses on reducing pain, improving mobility, and helping patients get back to their normal lives.
      </>
    ),
  },
  {
    title: "3. Brain Tumour Surgery",
    intro:
      "A brain tumour diagnosis can be life-changing, but with the right care, recovery is possible. Dr. Sardhara is experienced in treating both benign and malignant tumours, using advanced surgical techniques to ensure safety while preserving brain function.",
  },
  {
    title: "4. Chiari Malformation Surgery",
    intro:
      "Chiari Malformation involves the displacement of brain tissue into the spinal canal. Dr. Sardhara offers surgical treatments for this condition to prevent complications and improve quality of life.",
  },
];

const REASONS: { label: string; text: ReactNode }[] = [
  { label: "Proven Expertise", text: "With over 15 years of experience, he has handled some of the most challenging cases." },
  { label: "Advanced Techniques", text: "Specializing in minimally invasive surgeries that ensure faster recovery and less pain." },
  { label: "Patient-Centered Care", text: "Every treatment is customized to suit your condition and lifestyle." },
  {
    label: "Trusted Reputation",
    text: (
      <>
        Known as one of the <strong className={strong}>best neurosurgeons in Mulund</strong>, he has earned the trust of
        patients and families across Mumbai.
      </>
    ),
  },
];

export default function SurgeriesPage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <PageHero breadcrumb="Surgeries" title="Surgeries" />

      <section className="py-12 lg:py-14">
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            {BANNERS.map((b, i) => (
              <Reveal key={b.label} delay={i * 0.05}>
                <Link href={b.href} className="group block">
                  <div className="relative aspect-video overflow-hidden rounded-2xl ring-1 ring-navy-900/10 dark:ring-white/10">
                    <Image
                      src={b.image}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 32vw, 92vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <span className="mt-4 flex items-center justify-between gap-3 font-display text-lg font-medium text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                    {b.label}
                    <Arrow className="text-teal-600 dark:text-teal-400" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-14 lg:py-18">
        <Container className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading title="Dr. Jayesh Sardhara: Expert in Neuro and Spine Surgeries" />
          </div>
          <Reveal className="space-y-4 text-lg leading-relaxed text-muted lg:col-span-7 lg:pt-2">
            <p>
              Living with a brain or spine condition can be overwhelming, but finding the right care shouldn&rsquo;t be.
              With over 15 years of experience, <strong className={strong}>Dr. Jayesh Sardhara</strong> has become a
              trusted name in <strong className={strong}>neurosurgery and spine surgery in Mumbai</strong>, offering hope
              and healing to countless patients.
            </p>
            <p>
              Based in <strong className={strong}>Mulund, Mumbai</strong>, Dr. Sardhara is known for his patient-first
              approach, combining advanced techniques with personalised care. Whether it&rsquo;s a complex brain tumour or
              chronic back pain, he ensures that every patient receives the best possible treatment tailored to their
              needs.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-border bg-surface/50 py-14 lg:py-18">
        <Container>
          <SectionHeading
            title="Specialized Surgeries We Offer"
            description="Dr. Sardhara and his team are dedicated to providing comprehensive care for brain, spine, and neurological conditions. Here’s a look at the key procedures:"
            layout="split"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:gap-6">
            {SURGERIES.map((s, i) => (
              <Reveal key={s.title} delay={(i % 2) * 0.06} className="h-full">
                <article className="flex h-full flex-col bg-white p-7 shadow-card ring-1 ring-navy-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft hover:ring-navy-200 sm:p-8 dark:bg-white/5 dark:ring-white/10">
                  <h3 className="font-display text-xl font-medium leading-snug text-navy-900 dark:text-white">{s.title}</h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{s.intro}</p>

                  {s.items && (
                    <ul className="mt-5 grid gap-x-6 gap-y-2.5 border-t border-navy-900/10 pt-5 sm:grid-cols-2 dark:border-white/10">
                      {s.items.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm">
                          <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600 dark:bg-teal-400" />
                          <strong className={strong}>{item}</strong>
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.outro && <p className="mt-5 text-sm leading-relaxed text-muted">{s.outro}</p>}
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 lg:py-18">
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading title="Why Choose Dr. Jayesh Sardhara?" />
            <p className="mt-5 leading-relaxed text-muted">
              When it comes to your health, you deserve the best care. Here&rsquo;s why so many patients trust{" "}
              <strong className={strong}>Dr. Sardhara</strong> for their brain and spine treatments:
            </p>
          </div>

          <ul className="border-t border-navy-900/12 lg:col-span-7 dark:border-white/12">
            {REASONS.map((r) => (
              <li key={r.label} className="border-b border-navy-900/12 py-5 leading-relaxed text-muted dark:border-white/12">
                <strong className={strong}>{r.label}</strong>: {r.text}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="pb-14 lg:pb-18">
        <Container>
          <Reveal className="grid gap-6 rounded-3xl bg-navy-50 p-7 ring-1 ring-navy-100 sm:p-10 lg:grid-cols-12 lg:gap-12 dark:bg-white/4 dark:ring-white/10">
            <h2 className="font-display text-2xl font-medium leading-tight text-navy-900 sm:text-[1.9rem] lg:col-span-4 dark:text-white">
              Take the First Step Towards Recovery
            </h2>
            <div className="space-y-4 leading-relaxed text-muted lg:col-span-8">
              <p>
                We understand that every patient&rsquo;s needs are unique. That&rsquo;s why we don&rsquo;t just treat a
                condition—we care for the person. From your first consultation to post-surgery follow-ups, we&rsquo;re here
                to guide you every step of the way.
              </p>
              <p>
                Ready to take the first step towards recovery? Contact us today to learn more about how we can help you
                get back to living life on your terms.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
