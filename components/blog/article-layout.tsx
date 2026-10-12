import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/cta-band";
import { DoctorPhoto } from "@/components/ui/doctor-photo";
import { Faq } from "@/components/ui/faq";
import { Arrow } from "@/components/ui/arrow";
import { doctor } from "@/lib/data";
import { markCheckItems, stripTypedBullets, withHeadingIds } from "@/lib/article-toc";
import type { PostSummary } from "@/lib/content";

export interface ArticleLayoutProps {
  title: string;
  category?: string;
  readTime: string;
  date: string;
  /** Omit for the default author, Dr. Sardhara. */
  author?: string;
  image?: string;
  imageAlt?: string;
  excerpt?: string;
  html: string;
  faq?: { q: string; a: string }[];
  related: PostSummary[];
}

const sideCard = "bg-white p-6 shadow-card ring-1 ring-navy-100 dark:bg-white/5 dark:ring-white/10";

export function ArticleLayout({
  title,
  category,
  readTime,
  date,
  author,
  image,
  imageAlt,
  excerpt,
  html,
  faq = [],
  related,
}: ArticleLayoutProps) {
  const { html: body, headings } = withHeadingIds(markCheckItems(stripTypedBullets(html)));
  const byDoctor = !author || author === doctor.name;

  return (
    <>
      <article className="pt-28 sm:pt-32">
        <Container>
          <div className="max-w-4xl">
            <Link
              href="/blog/"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-teal-700"
            >
              <Arrow direction="left" /> All articles
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-muted">
              {category && (
                <>
                  <span className="font-semibold text-teal-700 dark:text-teal-300">{category}</span>
                  <span className="text-navy-300 dark:text-white/30">·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {readTime}
              </span>
            </div>
            <h1 className="mt-4 font-display text-[2.1rem] font-medium leading-[1.1] tracking-[-0.01em] text-navy-900 sm:text-4xl lg:text-[3rem] dark:text-white">
              {title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {date && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden /> {date}
                  </span>
                  <span className="text-navy-300 dark:text-white/30">·</span>
                </>
              )}
              <span>
                By {byDoctor ? `${doctor.name}, ${doctor.credentials}` : author}
              </span>
            </div>
          </div>

          {image && (
            <div className="relative mt-10 aspect-[21/9] overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10">
              <Image
                src={image}
                alt={imageAlt || title}
                fill
                priority
                sizes="(min-width: 1280px) 72rem, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-8">
              {excerpt && (
                <p className="mb-8 border-l-2 border-teal-500 pl-5 font-display text-xl font-medium leading-relaxed text-navy-800 dark:text-white/90">
                  {excerpt}
                </p>
              )}

              <div className="article" dangerouslySetInnerHTML={{ __html: body }} />

              {faq.length > 0 && (
                <section className="mt-16">
                  <h2 className="mb-6 font-display text-2xl font-medium text-navy-900 dark:text-white">
                    Frequently asked questions
                  </h2>
                  <Faq items={faq} />
                </section>
              )}
            </div>

            <aside className="lg:order-first lg:col-span-4">
              <div className="flex flex-col gap-5 lg:sticky lg:top-28">
                <div className={sideCard}>
                  {byDoctor ? (
                    <Link href="/about/" className="group flex items-center gap-4">
                      <DoctorPhoto className="h-16 w-16 shrink-0 rounded-full" sizes="64px" />
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-medium text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                          {doctor.name}
                        </span>
                        <span className="block text-xs text-muted">{doctor.credentials}</span>
                      </span>
                    </Link>
                  ) : (
                    <span className="block font-display text-lg font-medium text-navy-900 dark:text-white">{author}</span>
                  )}
                  {byDoctor && <p className="mt-4 text-sm leading-relaxed text-muted">{doctor.role}</p>}
                </div>

                {headings.length > 1 && (
                  <nav aria-label="On this page" className={`${sideCard} hidden lg:block`}>
                    <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
                      On this page
                    </h2>
                    <ol className="mt-4 space-y-1 border-l border-navy-900/10 dark:border-white/10">
                      {headings.map((h) => (
                        <li key={h.id}>
                          <a
                            href={`#${h.id}`}
                            className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm leading-snug text-muted transition-colors hover:border-teal-500 hover:text-navy-900 dark:hover:text-white"
                          >
                            {h.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}

                <div className="bg-navy-900 p-6 text-white dark:bg-navy-950 dark:ring-1 dark:ring-white/10">
                  <h2 className="font-display text-xl font-medium">Have a question about this topic?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Book a consultation for personalised, expert advice.
                  </p>
                  <Button href="/appointment/" variant="gold" className="group mt-5 w-full justify-center">
                    Book an Appointment <Arrow />
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section className="mt-16 border-t border-border bg-surface/50 py-14 lg:py-18">
          <Container>
            <h2 className="font-display text-2xl font-medium text-navy-900 sm:text-[1.9rem] dark:text-white">
              Related articles
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/${r.slug}/`} className="group flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                    <Image
                      src={r.image}
                      alt={r.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, 90vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                    {r.category && <span className="text-teal-700 dark:text-teal-300">{r.category}</span>}
                    {r.category && <span className="text-navy-300 dark:text-white/30">·</span>}
                    <span>{r.readingTime}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-medium leading-snug text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                    {r.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy-800 dark:text-white/80">
                    Read <Arrow className="text-teal-600 dark:text-teal-400" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBand />
    </>
  );
}
