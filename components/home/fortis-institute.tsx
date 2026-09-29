import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { VideoEmbed } from "@/components/ui/video-embed";
import { doctor, homeInlineVideos } from "@/lib/data";

export function FortisInstitute() {
  return (
    <section className="border-y border-border bg-surface/50 py-14 lg:py-18" id="fortis-institute">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <VideoEmbed video={homeInlineVideos.fortis} />
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-6">
            <Eyebrow>Fortis Institute</Eyebrow>
            <h2 className="mt-5 font-display text-[1.8rem] font-medium leading-[1.12] tracking-[-0.01em] text-navy-900 sm:text-[2.1rem] lg:text-[2.35rem] dark:text-white">
              Minimally Invasive Brain &amp; Spine Surgery
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
              <p>
                At Fortis Mumbai, {doctor.name}{" "}
                stands at the forefront of brain and spine innovation — a neurosurgeon
                redefining what&rsquo;s possible. With unmatched precision and a relentless patient-first approach, he
                transforms complex, high-risk surgeries into minimally invasive, life-changing procedures — often
                enabling patients to walk out the very same day.
              </p>
              <p>
                A pioneer in advanced neuro-endoscopy, {doctor.shortName}{" "}
                leads with skill, vision, and empathy. At the
                Fortis Institute of Minimally Invasive Brain &amp; Spine Surgery, his expertise turns
                &ldquo;keyhole&rdquo; techniques into powerful outcomes — delivering safer surgeries, faster recovery,
                and a new global benchmark in neurosurgical excellence.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
