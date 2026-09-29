import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CtaBand } from "@/components/ui/cta-band";
import { StoredJsonLd } from "@/components/seo/json-ld";
import {
  getDocByFileSlug,
  getPostsByTag,
  getTagDocs,
  metadataFromDoc,
  toPostSummary,
} from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTagDocs().map((d) => ({ tag: d.fileSlug.replace(/^tag\//, "") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const doc = getDocByFileSlug(`tag/${tag}`);
  if (!doc) return {};
  return metadataFromDoc(doc);
}

export default async function TagArchive({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const doc = getDocByFileSlug(`tag/${tag}`);
  if (!doc) notFound();

  const posts = getPostsByTag(tag).map(toPostSummary);

  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <PageHero
        eyebrow="Tag"
        breadcrumb={doc.title}
        title={`Tag: ${doc.title}`}
        description={`${posts.length} article${posts.length === 1 ? "" : "s"} tagged “${doc.title}”.`}
      />
      <section className="py-12 lg:py-14">
        <Container>
          {posts.length === 0 ? (
            <p className="border-t border-border py-20 text-center text-muted">
              No articles are currently tagged with this term.
            </p>
          ) : (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.slug} href={`/${p.slug}/`} className="group flex h-full flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col pt-5">
                    <span className="text-xs uppercase tracking-wider text-muted">{p.readingTime}</span>
                    <h2 className="mt-3 flex-1 font-display text-lg font-medium leading-snug text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                      {p.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-800 dark:text-white/80">
                      Read <ArrowUpRight className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
