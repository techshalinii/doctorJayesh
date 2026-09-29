import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { DoctorPhoto } from "@/components/ui/doctor-photo";
import { Reveal } from "@/components/ui/reveal";
import { doctor } from "@/lib/data";

const n = (v: number) => v.toLocaleString("en-US");

const highlights = [
  { value: `${doctor.publications}`, label: "Research Publications" },
  { value: "Gold Medal", label: "Best MCh Resident" },
  { value: `${doctor.books}`, label: "Books Authored" },
  { value: `${doctor.patents}`, label: "Patent Held" },
];

export function About() {
  return (
    <section className="py-16 lg:py-24" id="about">
      <Container>
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="order-2 lg:order-1 lg:col-span-5">
            <div className="border border-navy-900/10 p-2 dark:border-white/10">
              <DoctorPhoto
                className="aspect-square w-full"
                sizes="(min-width: 1024px) 40vw, 90vw"
              />
            </div>

            <p className="mt-3 flex items-baseline justify-between gap-4 text-xs text-muted">
              <span className="font-semibold text-navy-800 dark:text-white/80">
                {doctor.name}
              </span>

              <span>{doctor.credentials}</span>
            </p>
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:order-2 lg:col-span-7">
            <Eyebrow>About Doctor Jayesh Sardhara</Eyebrow>

            <h2 className="mt-6 font-display text-[2.05rem] font-medium leading-[1.1] tracking-tight text-navy-900 sm:text-4xl lg:text-[2.8rem] dark:text-white">
              Dr. Jayesh Sardhara Leading Neurosurgeon &amp; Spine Specialist
            </h2>

            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                With over {doctor.experienceYears} years of experience,{" "}
                {doctor.name} is not just a neurosurgeon — he&rsquo;s a
                dedicated healer, innovator, and mentor. As the Director of
                Minimally Invasive Brain and Spine Surgery at Fortis Group of
                Hospitals (Mulund, Kalyan &amp; S.L. Raheja), he has helped
                thousands of patients regain their health and mobility.
              </p>

              <p>
                His expertise lies in endoscopic brain and spine surgery,
                offering safer, faster recovery options. Having performed over{" "}
                {n(doctor.brainSurgeries)} brain tumor surgeries and{" "}
                {n(doctor.spineSurgeries)} spine surgeries, his impact speaks
                for itself. A recipient of the Best Young Neurosurgeon of India
                (2016, Mumbai) award, {doctor.shortName} is also a pediatric
                neurosurgeon, ensuring even the youngest patients receive
                world-class care.
              </p>

              <p>
                Beyond the operating room, he is a passionate researcher and
                innovator, holding one patent, {doctor.publications} research
                publications, and two authored books. As the Chairman of the
                Young Neurosurgical Forum and the Innovation &amp; Patent Cell
                at NSI, India, he is shaping the future of neurosurgery.
              </p>

              <p>
                For {doctor.shortName}, every patient is more than just a case —
                it&rsquo;s a life to be restored, a future to be rebuilt.
              </p>
            </div>
          </Reveal>
        </div>

        <dl className="mt-16 grid grid-cols-2 border-y border-navy-900/10 dark:border-white/10 sm:grid-cols-4">
          {highlights.map((h, i) => (
            <div
              key={h.label}
              className={[
                "min-w-0 px-6 py-7 lg:px-8 lg:py-8",
                i !== 0
                  ? "border-l border-navy-900/10 dark:border-white/10"
                  : "",
                i >= 2
                  ? "border-t border-navy-900/10 dark:border-white/10 sm:border-t-0"
                  : "",
              ].join(" ")}
            >
              <dt className="font-display text-3xl font-medium tracking-tight text-navy-900 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                {h.value}
              </dt>

              <dd className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted sm:text-xs">
                {h.label}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex justify-center">
          <Button href="/about/">
            Full profile &amp; credentials
          </Button>
        </div>
      </Container>
    </section>
  );
}
