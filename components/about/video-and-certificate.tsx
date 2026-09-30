import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { VideoEmbed } from "@/components/ui/video-embed";
import { doctor, aboutVideo } from "@/lib/data";

export function AboutVideoAndCertificate() {
  return (
    <section className="border-t border-border py-14 lg:py-18">
      <Container>
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
          <section aria-label="About Jayesh Sardhara" className="lg:col-span-7">
            <SectionHeading eyebrow="Video" title="About Jayesh Sardhara" />
            <Reveal className="mt-10">
              <VideoEmbed video={aboutVideo} />
            </Reveal>
          </section>

          <section aria-label="Certificates" className="lg:col-span-5">
            <SectionHeading eyebrow="Certificates" title="Credentials on record" />
            <Reveal className="mx-auto mt-10 max-w-[22rem]">
              <div className="relative aspect-[212/300] overflow-hidden ">
                <Image
                  src="/wp-content/uploads/2024/02/DOC-20240220-WA0052_240220_202124.jpg"
                  alt={`Certificate awarded to ${doctor.name}`}
                  fill
                  sizes="(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 90vw"
                  className="object-contain"
                />
              </div>
            </Reveal>
          </section>
        </div>
      </Container>
    </section>
  );
}
