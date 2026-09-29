import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { CardImage } from "@/components/ui/card-image";

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

const LEARN_MORE =
  "mt-5 inline-flex -translate-x-1.5 items-center gap-1.5 text-sm font-medium tracking-wide text-navy-800 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-[601px]:translate-x-0 max-[601px]:opacity-100 dark:text-teal-300";

export function Conditions() {
  return (
    <section className="py-14 lg:py-18" id="conditions">
      <Container>
        <SectionHeading
          layout="split"
          index="01"
          eyebrow="Conditions We Treat"
          title="Common Neurological Conditions We Address"
          description="Every condition is met with an accurate diagnosis and a tailored, evidence-based plan."
        />

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
