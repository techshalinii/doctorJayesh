import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Faq } from "@/components/ui/faq";
import { homeFaqs } from "@/lib/data";

/**
 * Section 12 of the live WordPress homepage.
 *
 * These are the same 7 Q&As already present in the page's stored FAQPage JSON-LD. Rendering
 * them visibly is not optional: FAQPage markup is only permitted for content the user can see.
 * <Faq> keeps every answer mounted and collapses with CSS, so all 7 questions AND all 7
 * answers are in the served markup — see the note in components/ui/faq.tsx.
 *
 * Label left, one full-width column of rows on the right: at two columns the questions wrapped
 * to three lines each and the rules stopped reading as a single list.
 */
export function Faqs() {
  return (
    <section className="py-14 lg:py-18" id="faqs">
      <Container>
        <div className="grid gap-x-16 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-sm font-medium tabular-nums text-teal-700/70 dark:text-teal-300/70">
                  07
                </span>
                <Eyebrow>FAQs</Eyebrow>
              </div>
              <h2 className="mt-5 font-display text-[1.9rem] font-medium leading-[1.1] tracking-[-0.01em] text-navy-900 sm:text-[2.2rem] dark:text-white">
                Questions patients ask
              </h2>
            </div>
          </div>

          <div className="lg:col-span-8">
            <Faq items={homeFaqs} />
          </div>
        </div>
      </Container>
    </section>
  );
}
