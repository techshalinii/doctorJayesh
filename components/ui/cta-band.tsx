import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Container } from "./container";
import { Button } from "./button";
import { Reveal } from "./reveal";
import { doctor } from "@/lib/data";

export function CtaBand() {
  const wa = `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent("Hello, I'd like to book a consultation.")}`;
  return (
    <section className="py-14 lg:py-18">
      <Container>
        <Reveal className="overflow-hidden rounded-2xl border-t-2 border-teal-500 bg-navy-900 text-white dark:bg-navy-950">
          <div className="grid items-center gap-10 p-6 sm:p-14 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-300">
                <span className="h-px w-8 bg-teal-400/60" /> Appointments
              </span>
              <h2 className="mt-5 max-w-xl font-display text-3xl font-medium leading-[1.1] sm:text-[2.6rem]">
                Ready to talk to a specialist?
              </h2>
              <p className="mt-4 max-w-lg text-white/70">
                Book a consultation with {doctor.name}, or reach our care team directly — we&apos;ll guide you through
                every step.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:border-l lg:border-white/10 lg:pl-10">
              <Button href="/appointment/" variant="gold" size="lg" className="w-full">
                Book an Appointment <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-3 text-sm">
                <a href={`tel:${doctor.phoneRaw}`} className="flex items-center gap-3 text-white/80 transition-colors hover:text-white">
                  <Phone className="h-4 w-4 text-teal-300" /> {doctor.phone}
                </a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/80 transition-colors hover:text-white">
                  <MessageCircle className="h-4 w-4 text-teal-300" /> Message on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
