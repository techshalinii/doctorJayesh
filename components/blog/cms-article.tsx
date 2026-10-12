import { ArticleLayout } from "@/components/blog/article-layout";
import { renderBlocks } from "@/lib/cms/blocks";
import type { BlogRow } from "@/lib/cms/types";
import type { PostSummary } from "@/lib/content";

export function CmsArticle({ post, related }: { post: BlogRow; related: PostSummary[] }) {
  const date = post.publish_at
    ? new Date(post.publish_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: post.time_zone || "Asia/Kolkata",
      })
    : "";

  return (
    <ArticleLayout
      title={post.title}
      category={post.category || undefined}
      readTime={`${post.read_time} min read`}
      date={date}
      author={post.author || undefined}
      image={post.featured_image || undefined}
      imageAlt={post.image_alt || undefined}
      excerpt={post.excerpt || undefined}
      html={renderBlocks(post.content)}
      faq={post.faq.map((item) => ({ q: item.question, a: item.answer }))}
      related={related}
    />
  );
}
