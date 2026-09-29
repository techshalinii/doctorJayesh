import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { doctor, locations } from "@/lib/data";

export function AppointmentCTA() {
  const wa = `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent("Hello, I'd like to book a consultation.")}`;

  return (
    <section className="py-16 lg:py-24" id="appointment">
      <Container>
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-between gap-10 bg-navy-900 p-6 text-white sm:p-12 dark:bg-navy-950">
              <div>
                <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-300">
                  <span className="h-px w-8 bg-teal-400/60" /> Book Your Visit
                </span>
                <h2 className="mt-5 font-display text-3xl font-medium leading-[1.12] sm:text-[2.4rem]">
                  Take the first step toward expert care.
                </h2>
                <p className="mt-4 max-w-md text-white/70">
                  Book a consultation with {doctor.name}. For emergencies, call us directly — we&apos;re here around the
                  clock.
                </p>
              </div>

              <div className="divide-y divide-white/10 border-y border-white/10">
                <a href={`tel:${doctor.phoneRaw}`} className="flex items-center gap-4 py-4 transition-colors hover:text-teal-300">
                  <Phone className="h-5 w-5 text-teal-300" />
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-white/50">Emergency / Appointments</span>
                    <span className="block text-lg font-medium">{doctor.phone}</span>
                  </span>
                </a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 py-4 transition-colors hover:text-teal-300">
                  <MessageCircle className="h-5 w-5 text-teal-300" />
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-white/50">Chat with us</span>
                    <span className="block text-lg font-medium">WhatsApp Now</span>
                  </span>
                </a>
                <div className="flex items-center gap-4 py-4 text-sm text-white/70">
                  <Clock className="h-5 w-5 text-teal-300" /> OPD · {doctor.opd}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {locations.map((l) => (
                  <div key={l.name} className="flex items-start gap-3 text-sm text-white/70">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                    <span>
                      <span className="block font-medium text-white">{l.name}</span>
                      {l.address}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Reveal className="bg-background p-6 sm:p-12">
              <h3 className="font-display text-2xl font-medium text-navy-900 dark:text-white">Request an appointment</h3>
              <p className="mt-1.5 text-sm text-muted">We&apos;ll confirm within a few hours.</p>
              <div className="mt-8">
                <AppointmentForm />
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
