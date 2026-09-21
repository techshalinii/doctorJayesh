"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoItem } from "@/lib/data";

/**
 * Click-to-play video facade.
 *
 * The live WordPress pages carried up to 15 Elementor video widgets on a single page. Loading
 * that many iframes eagerly is a serious Core Web Vitals cost, so nothing is fetched until the
 * viewer actually clicks: until then this is a poster image and a button.
 *
 * Poster frames come straight from the platform's own thumbnail CDN — a plain <img>, so no
 * `next/image` remote-pattern configuration is needed.
 */
export function VideoEmbed({ video, className }: { video: VideoItem; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const shorts = video.platform === "youtube-shorts";

  const poster =
    video.platform === "vimeo"
      ? null
      : `https://i.ytimg.com/vi/${video.id}/${shorts ? "hqdefault" : "maxresdefault"}.jpg`;

  const src =
    video.platform === "vimeo"
      ? `https://player.vimeo.com/video/${video.id}?autoplay=1`
      : `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;

  return (
    <figure className={cn("group", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10",
          shorts ? "aspect-[9/16]" : "aspect-video",
        )}
      >
        {playing ? (
          <iframe
            src={src}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${video.title}`}
            className="absolute inset-0 h-full w-full cursor-pointer"
          >
            {poster && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={poster}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            )}
            <span className="absolute inset-0 bg-navy-950/25 transition-colors group-hover:bg-navy-950/35" />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-teal transition-transform group-hover:scale-105">
              <Play className="ml-0.5 h-6 w-6 fill-navy-900 text-navy-900" />
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-muted">{video.title}</figcaption>
    </figure>
  );
}
