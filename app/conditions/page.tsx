import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/ui/cta-band";
import { conditions } from "@/lib/data";

export const metadata: Metadata = pageMetadata({
  path: "/conditions",
  title: "Conditions Treated",
  description: "Brain and spine conditions treated — from brain tumors, aneurysms and Parkinson's to herniated discs, sciatica, spinal stenosis and scoliosis.",
});

export default function ConditionsPage() {
  const groups = [
    { ...conditions.brain, href: "/brain-surgery", index: "01" },
    { ...conditions.spine, href: "/spine-surgery", index: "02" },
  ];

  return (
    <>
      {/* Template-only route: keeps the generated Physician schema. Migrated pages
          render <StoredJsonLd /> instead — the two are never merged. */}
      <JsonLd />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", path: "/" },
          { name: "Conditions", path: "/conditions" },
        ]}
      />
      <PageHero
        eyebrow="Conditions We Treat"
        breadcrumb="Conditions"
        title="Conditions we treat"
        description="An accurate diagnosis is the foundation of good care. Explore the brain and spine conditions we treat — each with a tailored, evidence-based plan."
      />

      <section className="py-14 lg:py-20">
        <Container className="space-y-24">
          {groups.map((g) => (
            <div key={g.title} className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <span className="font-display text-sm font-medium text-teal-700/70 dark:text-teal-300/70">{g.index}</span>
                  <h2 className="mt-3 font-display text-3xl font-medium text-navy-900 dark:text-white">{g.title}</h2>
                  <p className="mt-4 leading-relaxed text-muted">
                    Expert surgical and non-surgical management for the full range of {g.title.toLowerCase()}.
                  </p>
                  <Link
                    href={g.href}
                    className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy-800 dark:text-white/80"
                  >
                    Explore treatment
                    <ArrowRight className="h-4 w-4 text-teal-600 transition-transform group-hover:translate-x-1 dark:text-teal-400" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="border-t border-navy-900/12 dark:border-white/12">
                  {g.items.map((it, i) => (
                    <Reveal key={it.name} delay={(i % 6) * 0.05}>
                      <Link
                        href={g.href}
                        className="group grid grid-cols-1 gap-x-8 gap-y-1 border-b border-navy-900/12 py-6 transition-colors hover:bg-surface/60 dark:border-white/12 sm:grid-cols-[12rem_1fr]"
                      >
                        <h3 className="font-display text-lg font-medium text-navy-900 transition-transform duration-300 group-hover:translate-x-1 dark:text-white">
                          {it.name}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted">{"long" in it ? it.long : it.desc}</p>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
