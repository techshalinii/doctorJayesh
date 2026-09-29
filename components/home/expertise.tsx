import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { CardImage } from "@/components/ui/card-image";
import { expertise } from "@/lib/data";

const PHOTOS = [
  { src: "/images/expertise/brain-tumor-surgery.jpg", alt: "Neurosurgeon planning brain tumor surgery using neuro-navigation" },
  { src: "/images/expertise/spine-surgery.jpg", alt: "Spine surgeon reviewing a spinal X-ray with a patient" },
  { src: "/images/expertise/endoscopic-skull-base-surgery.jpg", alt: "Clinician reviewing brain imaging on a monitor" },
  { src: "/images/expertise/pediatric-neurosurgery.jpg", alt: "A young child, the age group paediatric neurosurgery cares for" },
  { src: "/images/expertise/minimally-invasive-spine-surgery.jpg", alt: "Surgeon performing minimally invasive spine surgery" },
  { src: "/images/expertise/neurovascular-surgery.jpg", alt: "Surgeon reviewing brain scans in theatre" },
] as const;

export function Expertise() {
  return (
    <section className="border-y border-border bg-surface/50 py-16 lg:py-24" id="expertise">
      <Container>
        <div className="grid gap-8 md:grid-cols-2 md:items-end">
          <SectionHeading
            index="02"
            eyebrow="Areas of Expertise"
            title="Subspecialty care across the brain & spine"
          />
          <p className="text-muted md:pb-2">
            From complex tumor resection to keyhole disc surgery — the full spectrum, delivered with the latest
            technology and a minimally invasive philosophy.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 items-start gap-12 min-[601px]:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16">
          {expertise.map((e, i) => {
            const photo = PHOTOS[i] ?? PHOTOS[0];
            return (
              <Reveal key={e.slug} delay={(i % 3) * 0.06}>
                <Link
                  href={e.href}
                  className="group flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
                >
                  <CardImage
                    src={photo.src}
                    alt={photo.alt}
                    ratio="3/2"
                    sizes="(min-width: 1024px) 30vw, (min-width: 601px) 45vw, 92vw"
                  />

                  <span className="mt-6 font-display text-lg font-medium tabular-nums text-teal-700/60 transition-colors group-hover:text-navy-800 group-focus-visible:text-navy-800 dark:text-teal-300/60 dark:group-hover:text-teal-300 dark:group-focus-visible:text-teal-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <h3 className="mt-4 font-display text-xl font-medium text-navy-900 dark:text-white">{e.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{e.short}</p>

                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy-800 dark:text-white/80">
                    Learn more
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 text-teal-600 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 dark:text-teal-400"
                    />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
