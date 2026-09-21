import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/cta-band";
import { doctor } from "@/lib/data";
import { renderBlocks } from "@/lib/cms/blocks";
import type { BlogRow } from "@/lib/cms/types";
import type { PostSummary } from "@/lib/content";

/**
 * Article template for a CMS post.
 *
 * Deliberately mirrors the markup `app/[slug]/page.tsx` renders for a migrated post —
 * same hero, same meta row, same `.article` prose container, same related grid — so a
 * reader cannot tell which source a post came from, and a change to the article design
 * has exactly two places to touch rather than two designs to reconcile.
 *
 * The body arrives as structured blocks and is compiled by `renderBlocks()`, which
 * escapes every value it interpolates. The HTML handed to `dangerouslySetInnerHTML`
 * below therefore contains only tags this codebase emitted.
 */
export function CmsArticle({ post, related }: { post: BlogRow; related: PostSummary[] }) {
  const html = renderBlocks(post.content);

  const date = post.publish_at
    ? new Date(post.publish_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: post.time_zone || "Asia/Kolkata",
      })
    : "";

  return (
    <>
      <article className="pt-32 sm:pt-40">
        <Container className="max-w-3xl">
          <Link
            href="/blog/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
            {post.category && (
              <>
                <span className="text-teal-700 dark:text-teal-300">{post.category}</span>
                <span className="text-navy-300 dark:text-white/30">·</span>
              </>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {post.read_time} min read
            </span>
          </div>
          <h1 className="mt-4 font-display text-[2.1rem] font-medium leading-[1.1] tracking-[-0.01em] text-navy-900 sm:text-4xl lg:text-[3rem] dark:text-white">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-6 text-sm text-muted">
            {date && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> {date}
                </span>
                <span className="text-navy-300 dark:text-white/30">·</span>
              </>
            )}
            <span>
              By {post.author || doctor.name}
              {post.author ? "" : `, ${doctor.credentials}`}
            </span>
          </div>
        </Container>

        {post.featured_image && (
          <Container className="mt-10 max-w-4xl">
            <div className="relative aspect-[21/9] overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10">
              <Image
                src={post.featured_image}
                alt={post.image_alt || post.title}
                fill
                priority
                sizes="(min-width: 1024px) 56rem, 100vw"
                className="object-cover"
              />
            </div>
          </Container>
        )}

        <Container className="mt-14 max-w-3xl">
          {post.excerpt && (
            <p className="mb-8 border-l-2 border-teal-500 pl-5 font-display text-xl font-medium leading-relaxed text-navy-800 dark:text-white/90">
              {post.excerpt}
            </p>
          )}

          <div className="article" dangerouslySetInnerHTML={{ __html: html }} />

          {post.faq.length > 0 && (
            <section className="mt-16 border-t border-navy-900/12 pt-10 dark:border-white/12">
              <h2 className="font-display text-2xl font-medium text-navy-900 dark:text-white">
                Frequently asked questions
              </h2>
              <dl className="mt-8 space-y-7">
                {post.faq.map((item, i) => (
                  <div key={i}>
                    <dt className="font-display text-lg font-medium text-navy-900 dark:text-white">
                      {item.question}
                    </dt>
                    <dd className="mt-2 leading-relaxed text-muted">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="mt-14 flex flex-col items-start gap-4 border-t border-navy-900/12 pt-8 dark:border-white/12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-medium text-navy-900 dark:text-white">
                Have a question about this topic?
              </h3>
              <p className="mt-1 text-sm text-muted">
                Book a consultation for personalised, expert advice.
              </p>
            </div>
            <Button href="/appointment/" className="shrink-0">
              Book an Appointment <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border py-14">
          <Container>
            <h2 className="font-display text-2xl font-medium text-navy-900 dark:text-white">
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
                  <h3 className="mt-4 font-display text-lg font-medium leading-snug text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                    {r.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy-800 dark:text-white/80">
                    Read <ArrowUpRight className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
