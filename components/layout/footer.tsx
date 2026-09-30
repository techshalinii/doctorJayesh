import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { doctor, locations, nav, socialLinks } from "@/lib/data";
import { FooterMap } from "./footer-map";

const icons: Record<string, string> = {
  LinkedIn: "M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 8.98h4v12H3v-12zM10 8.98h3.8v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v6.31h-4v-5.6c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.15 1.45-2.15 2.95v5.7H10v-12z",
  Instagram: "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.26 2.2.43.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.4.37 1 .43 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.26 1.8-.43 2.2-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.4.17-1 .37-2.2.43-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.26-2.2-.43a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.17-.4-.37-1-.43-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.26-1.8.43-2.2.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.4-.17 1-.37 2.2-.43C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.84-.4.4-.64.8-.84 1.3-.16.4-.35 1-.4 2.1C2.6 9.7 2.6 10.1 2.6 12s0 2.3.06 3.5c.05 1.1.24 1.7.4 2.1.2.5.44.9.84 1.3.4.4.8.64 1.3.84.4.16 1 .35 2.1.4 1.2.06 1.6.07 4.7.07s3.5 0 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.84.4-.4.64-.8.84-1.3.16-.4.35-1 .4-2.1.06-1.2.07-1.6.07-3.5s0-2.3-.07-3.5c-.05-1.1-.24-1.7-.4-2.1a3.5 3.5 0 00-.84-1.3 3.5 3.5 0 00-1.3-.84c-.4-.16-1-.35-2.1-.4-1.2-.06-1.6-.07-4.7-.07zm0 3.1a4.9 4.9 0 110 9.8 4.9 4.9 0 010-9.8zm0 1.8a3.1 3.1 0 100 6.2 3.1 3.1 0 000-6.2zm5.1-.9a1.15 1.15 0 110 2.3 1.15 1.15 0 010-2.3z",
  YouTube: "M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.76-1.76C19.3 5.1 12 5.1 12 5.1s-7.3 0-8.84.43A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7c.24.87.9 1.53 1.76 1.76C4.7 18.9 12 18.9 12 18.9s7.3 0 8.84-.43a2.5 2.5 0 001.76-1.76C23 15.2 23 12 23 12zM9.75 15.02V8.98L15 12l-5.25 3.02z",
};

const services = [
  { label: "Brain Tumor Surgery", href: "/brain-surgery" },
  { label: "Spine Surgery", href: "/spine-surgery" },
  { label: "Minimally Invasive Spine", href: "/spine-surgery" },
  { label: "Deep Brain Stimulation", href: "/brain-surgery" },
  { label: "Conditions Treated", href: "/conditions" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <FooterMap />
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-3" aria-label={doctor.name}>
            <Logo height={44} />
            <span className="text-sm font-bold text-navy-900 dark:text-white">{doctor.name}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{doctor.intro}</p>
          <div className="mt-5 flex gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} — opens in a new tab`}
                className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-border text-muted transition-colors hover:bg-navy-900 hover:text-white dark:hover:bg-teal-500 dark:hover:text-navy-950"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d={icons[s.label]} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-900 dark:text-white">Quick Links</h3>
          <ul className="mt-4 space-y-2.5">
            {nav.map((it) => (
              <li key={it.label}>
                <Link href={it.href} className="text-sm text-muted transition-colors hover:text-teal-600">
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-900 dark:text-white">Services</h3>
          <ul className="mt-4 space-y-2.5">
            {services.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="text-sm text-muted transition-colors hover:text-teal-600">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-900 dark:text-white">Contact</h3>
          <ul className="mt-4 space-y-3.5 text-sm text-muted">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              <a href={`tel:${doctor.phoneRaw}`} className="hover:text-teal-600">{doctor.phone}</a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              <a href={`mailto:${doctor.email}`} className="break-all hover:text-teal-600">{doctor.email}</a>
            </li>
            {locations.map((l) => (
              <li key={l.name} className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span>
                  <span className="font-medium text-navy-800 dark:text-white/90">{l.name}</span>
                  <br />
                  {l.address}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      
      <div className="border-t border-border">
        <Container className="flex flex-col gap-4 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {doctor.name}. All rights reserved.</p>
          <p className="max-w-xl leading-relaxed">
            <strong className="font-semibold text-navy-700 dark:text-white/80">Medical disclaimer:</strong> The content on
            this website is for general information only and is not a substitute for professional medical advice,
            diagnosis or treatment. Always consult a qualified physician.
          </p>
        </Container>
      </div>
    </footer>
  );
}
