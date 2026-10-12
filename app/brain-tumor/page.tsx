import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/ui/cta-band";

const doc = getDocByFileSlug("brain-tumor")!;

export const metadata: Metadata = metadataFromDoc(doc);

const strong = "font-semibold text-navy-900 dark:text-white";
const card =
  "bg-white p-7 shadow-card ring-1 ring-navy-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft hover:ring-navy-200 sm:p-8 dark:bg-white/5 dark:ring-white/10";
const roundedCard = `rounded-3xl ${card}`;

const CONDITIONS: { label: string; text: ReactNode }[] = [
  {
    label: "Brain Tumors:",
    text: (
      <>
        These are among the most complex neurological conditions. Dr. Jayesh offers both traditional and advanced
        therapies tailored to your needs. We ensure the highest standard of care for{" "}
        <strong className={strong}>brain tumor surgery in Mumbai</strong>.
      </>
    ),
  },
  {
    label: "Spinal Conditions:",
    text: "Issues like herniated discs or spinal tumors can severely affect mobility. We provide both non-surgical and advanced surgical treatments.",
  },
  {
    label: "Stroke Management:",
    text: "Immediate response is key. We offer urgent evaluation and surgical options when needed to reduce long-term neurological damage.",
  },
  {
    label: "Chronic Pain and Nerve Disorders:",
    text: "From sciatica to nerve compression, we provide advanced pain relief and mobility-enhancing solutions tailored to your condition.",
  },
];

export default function BrainTumorPage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <PageHero breadcrumb="Brain Tumor" title="Brain Tumor" />

      <section className="py-14 lg:py-18">
        <Container className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <div className="relative aspect-video overflow-hidden rounded-2xl ring-1 ring-navy-900/10 dark:ring-white/10">
              <Image
                src="/wp-content/uploads/2025/01/2-1.png"
                alt="Brain Tumor"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.08} className="space-y-4 text-lg leading-relaxed text-muted lg:col-span-6">
            <p>
              <strong className={strong}>A brain tumor is an abnormal growth of cells in the brain.</strong> Tumors can be
              benign (non-cancerous) or malignant (cancerous). Brain tumors can cause symptoms such as headaches, seizures,
              or changes in memory and thinking.
            </p>
            <p>
              Due to the brain&rsquo;s complexity and vital role, it&rsquo;s crucial to diagnose any suspected tumor as soon
              as possible. Treatment will depend on factors like the type, size, and location of the tumor, and may involve
              surgery, radiation therapy, or chemotherapy to remove or shrink the tumor and manage symptoms.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-border bg-surface/50 py-14 lg:py-18">
        <Container className="grid gap-5 md:grid-cols-2 lg:gap-6">
          <Reveal className="h-full">
            <article className={`${roundedCard} h-full`}>
              <h2 className="font-display text-2xl font-medium leading-tight text-navy-900 dark:text-white">
                Why Early Diagnosis Matters?
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Early detection improves treatment outcomes. At first, brain tumors might not show obvious symptoms, making
                regular screenings and consulting with a <strong className={strong}>neurosurgeon</strong> vital, especially
                for those at higher risk. For expert advice, our <strong className={strong}>Brain Tumor Specialties</strong>{" "}
                are tailored to ensure you get the best care possible.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.06} className="h-full">
            <article className={`${roundedCard} h-full`}>
              <h2 className="font-display text-2xl font-medium leading-tight text-navy-900 dark:text-white">
                Treatment Options
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Whether the tumor is benign and can be monitored or malignant and requires immediate action, we offer
                advanced diagnostic tools such as MRI and CT scans, along with a variety of treatment methods. Our primary
                goal is to ensure the best recovery while minimizing any lasting impact on brain function.
              </p>
            </article>
          </Reveal>
        </Container>
      </section>

      <section className="py-14 lg:py-18">
        <Container>
          <SectionHeading title="Common Conditions We Treat" />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:gap-6">
            {CONDITIONS.map((c, i) => (
              <Reveal key={c.label} delay={(i % 2) * 0.06} className="h-full">
                <article className={`${card} h-full`}>
                  <p className="leading-relaxed text-muted">
                    <strong className={`${strong} font-display text-lg font-medium`}>{c.label}</strong> {c.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 rounded-3xl bg-navy-50 p-7 ring-1 ring-navy-100 sm:p-10 dark:bg-white/4 dark:ring-white/10">
            <p className="max-w-4xl text-lg leading-relaxed text-foreground/85">
              For personalized care and expert <strong className={strong}>brain tumor treatment</strong>, consult our
              experienced team. Reach out to our <strong className={strong}>brain tumor surgeon in Mulund</strong> for
              guidance and a treatment plan tailored just for you.
            </p>
          </Reveal>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
