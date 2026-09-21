import Link from "next/link";
import { Container } from "./container";
import { Reveal } from "./reveal";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border pt-36 pb-12 sm:pt-44 lg:pb-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-teal-400/[0.06] blur-3xl" />
      </div>
      <Container>
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
          <Link href="/" className="transition-colors hover:text-teal-700">Home</Link>
          <span className="text-navy-300 dark:text-white/30">/</span>
          <span className="font-medium text-navy-800 dark:text-white/80">{breadcrumb ?? eyebrow}</span>
        </nav>
        <Reveal>
          {eyebrow && (
            <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              <span className="h-px w-8 bg-teal-600/50" />
              {eyebrow}
            </span>
          )}
          <h1 className="mt-6 max-w-4xl font-display text-[2.1rem] font-medium leading-[1.06] tracking-[-0.02em] text-navy-900 xs:text-[2.6rem] sm:text-5xl lg:text-[3.6rem] dark:text-white">
            {title}
          </h1>
          {description && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>}
          {children && <div className="mt-9">{children}</div>}
        </Reveal>
      </Container>
    </section>
  );
}
