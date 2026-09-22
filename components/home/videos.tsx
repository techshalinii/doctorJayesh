import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { VideoEmbed } from "@/components/ui/video-embed";
import { Button } from "@/components/ui/button";
import { videos } from "@/lib/data";

/** The practice's YouTube playlist — the full set the three below are drawn from. */
const PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLZqn4r4wue_0dhT21fIrR8fkYEU05GQ_E";

/**
 * Surgical technique and patient-education videos, migrated from the live homepage's
 * Elementor video widgets. Every player is click-to-load — see components/ui/video-embed.tsx.
 *
 * Three across. The homepage carries five videos in total; the export attaches two of them
 * to sections 7 and 8, which render them inline (see lib/data.ts `homeInlineVideos`), and
 * these three to the gallery. All five still render, each where the live page had it.
 */
export function Videos() {
  const items = videos.home;
  if (!items?.length) return null;

  return (
    <section className="py-14 lg:py-18" id="videos">
      <Container>
        <SectionHeading
          layout="split"
          index="05"
          eyebrow="Watch"
          title="Surgical technique & patient education"
          description="Recorded procedures, explainers and interviews — from the operating theatre and the consulting room."
        />
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v, i) => (
            <Reveal key={`${v.id}-${i}`} delay={(i % 3) * 0.05}>
              <VideoEmbed video={v} />
            </Reveal>
          ))}
        </div>

        {/* Matches the trailing button <Awards> uses, so the two sections close the same
            way. External, so it opens in a new tab — the sr-only note says so for screen
            readers, which the arrow glyph only conveys visually. */}
        <Button
          href={PLAYLIST_URL}
          className="mt-12"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch more on YouTube
          <ArrowUpRight className="h-4 w-4" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Button>
      </Container>
    </section>
  );
}
