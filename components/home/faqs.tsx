import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Faq } from "@/components/ui/faq";
import { homeFaqs } from "@/lib/data";

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
