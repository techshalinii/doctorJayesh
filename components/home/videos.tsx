import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { VideoEmbed } from "@/components/ui/video-embed";
import { Button } from "@/components/ui/button";
import { videos } from "@/lib/data";

const PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLZqn4r4wue_0dhT21fIrR8fkYEU05GQ_E";

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
        />
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v, i) => (
            <Reveal key={`${v.id}-${i}`} delay={(i % 3) * 0.05}>
              <VideoEmbed video={v} />
            </Reveal>
          ))}
        </div>

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
