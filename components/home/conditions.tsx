import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { CardImage } from "@/components/ui/card-image";

/**
 * Section 6 of the live WordPress homepage — four conditions across.
 *
 * These are exactly the four the export carried (Brain Tumor, Spine Injury, Stroke,
 * Sciatica) in the export's order. The template one-liners that used to pad this grid to
 * six are not homepage content; the full list of eleven is at /conditions/, linked below.
 *
 * `href` stays on the two treatment pages rather than a per-condition route: /conditions/
 * is a single page with no dynamic segment and no per-condition anchors, so
 * /conditions/brain-tumors and its siblings 404.
 *
 * The blurbs are held here rather than read from `conditions` in lib/data.ts. The data
 * module carries the migrated WordPress paragraphs, which run long for a four-across grid;
 * those are still what /conditions/ and the treatment pages render, so nothing is lost.
 *
 * The photos in /public/images/conditions/ are generated placeholders — warm gradients at
 * the right ratio, no text — meant to be overwritten with real photography under these
 * filenames. The alt text describes the intended photograph.
 */
const CARDS = [
  {
    name: "Brain Tumors",
    href: "/brain-surgery/",
    img: "/images/conditions/brain-tumors.jpg",
    alt: "Doctor reviewing a brain MRI scan",
    body: "Benign or malignant growths in the brain, treated with surgery, radiation or chemotherapy based on type and location.",
  },
  {
    name: "Spine Injury",
    href: "/spine-surgery/",
    img: "/images/conditions/spine-injury.jpg",
    alt: "Neurosurgeon examining a patient's spine",
    body: "Damage to the spinal cord or its supporting structures from trauma. Early care limits paralysis and long-term disability.",
  },
  {
    name: "Stroke",
    href: "/brain-surgery/",
    img: "/images/conditions/stroke.jpg",
    alt: "Doctor assessing a patient for stroke symptoms",
    body: "A disruption of blood flow to the brain. Every minute counts, so urgent intervention protects brain function.",
  },
  {
    name: "Sciatica",
    href: "/spine-surgery/",
    img: "/images/conditions/sciatica.jpg",
    alt: "Patient receiving treatment for lower back and leg pain",
    body: "Nerve pain running from the lower back down one leg, treated with therapy or surgical decompression.",
  },
] as const;

/**
 * Hidden until hover, but never removed from flow — it reserves its own height so the card
 * does not grow by a line when the pointer lands on it. Always shown at 600px and below
 * (`max-[601px]` compiles to "< 601px", i.e. <= 600), where there is no hover to reveal it.
 * Focus mirrors hover so a keyboard user sees exactly what a mouse user sees.
 */
const LEARN_MORE =
  "mt-5 inline-flex -translate-x-1.5 items-center gap-1.5 text-sm font-medium tracking-wide text-navy-800 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-[601px]:translate-x-0 max-[601px]:opacity-100 dark:text-teal-300";

export function Conditions() {
  return (
    <section className="border-y border-border bg-surface/50 py-14 lg:py-18" id="conditions">
      <Container>
        <SectionHeading
          layout="split"
          index="01"
          eyebrow="Conditions We Treat"
          title="Common Neurological Conditions We Address"
          description="Every condition is met with an accurate diagnosis and a tailored, evidence-based plan."
        />

        {/* 1 / 2 / 4 columns at a flat 40px gap. The middle breakpoint is arbitrary rather
            than `sm` because the brief pins the single-column switch to 600px and Tailwind's
            `sm` sits at 640px. */}
        <div className="mt-12 grid grid-cols-1 items-start gap-10 min-[601px]:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <Reveal key={c.name} delay={(i % 4) * 0.05}>
              <Link
                href={c.href}
                className="group flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
              >
                <CardImage
                  src={c.img}
                  alt={c.alt}
                  ratio="4/3"
                  sizes="(min-width: 1024px) 22vw, (min-width: 601px) 45vw, 92vw"
                />

                <h3 className="mt-6 font-display text-xl font-medium text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                  {c.name}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>

                <span className={LEARN_MORE}>
                  Learn more
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Link
          href="/conditions/"
          className="group mt-12 inline-flex items-center gap-2 text-sm font-medium text-navy-800 dark:text-white/80"
        >
          All conditions we treat
          <ArrowRight className="h-4 w-4 text-teal-600 transition-transform group-hover:translate-x-1 dark:text-teal-400" />
        </Link>
      </Container>
    </section>
  );
}
