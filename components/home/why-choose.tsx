import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { VideoEmbed } from "@/components/ui/video-embed";
import { whyChooseSardhara, homeInlineVideos } from "@/lib/data";

/**
 * Section 7 of the live WordPress homepage.
 *
 * The export attaches a video to this section, not to the gallery further down, so it
 * renders here — beside the three reasons, as on the live page. Copy is verbatim.
 */
export function WhyChoose() {
  return (
    <section className="py-14 lg:py-18">
      <Container>
        <SectionHeading
          layout="split"
          index="03"
          eyebrow="Why Choose Us"
          title="Why Choose Dr. Jayesh Sardhara?"
          description="World-class technology and international training, applied with genuine warmth — the reasons thousands trust us with their brain and spine health."
        />

        <div className="mt-12 grid gap-x-14 gap-y-10 lg:grid-cols-12">
          {/* three reasons */}
          <Stagger className="lg:col-span-7">
            <div className="border-t border-navy-900/12 dark:border-white/12">
              {whyChooseSardhara.map((w, i) => (
                <StaggerItem key={w.label}>
                  <div className="grid gap-x-6 border-b border-navy-900/12 py-6 dark:border-white/12 sm:grid-cols-[3rem_1fr]">
                    <span className="font-display text-sm font-medium tabular-nums text-teal-700/60 dark:text-teal-300/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-medium text-navy-900 dark:text-white">{w.label}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{w.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
            <Button href="/about/" className="mt-8">
              About the surgeon
            </Button>
          </Stagger>

          {/* section video */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <VideoEmbed video={homeInlineVideos.whyChoose} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
