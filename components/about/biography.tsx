import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { DoctorPhoto } from "@/components/ui/doctor-photo";
import { Reveal } from "@/components/ui/reveal";
import { doctor, affiliations, SURGERIES_TOTAL } from "@/lib/data";

const stats = [
  { value: SURGERIES_TOTAL, label: "Surgeries Performed" },
  { value: `${doctor.publications}`, label: "Publications" },
  { value: `0${doctor.books}`, label: "Books Authored" },
  { value: `0${doctor.patents}`, label: "Patent Held" },
];

const timeline = [
  { year: "—", title: "MBBS & MS", desc: "Foundational medical and surgical training with distinction." },
  { year: "2014", title: "MCh in Neurosurgery", desc: "Advanced neurosurgical specialisation — awarded the Prof. R. K. Sharma Gold Medal." },
  { year: "—", title: "International Fellowships", desc: "Focused training in endoscopic and minimally invasive brain & spine surgery." },
  { year: "2016", title: "Best Young Neurosurgeon of India", desc: "National recognition for surgical excellence and research." },
  { year: "Present", title: "Leadership at NSI", desc: "Chairman of the Young Neurosurgical Forum and Innovation & Patent Cell." },
];

export function AboutBiography() {
  return (
    <section className="py-14 lg:py-20">
      <Container className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="border border-navy-900/10 p-2 dark:border-white/10">
            <DoctorPhoto className="aspect-[4/5] w-full" priority />
          </div>
          <dl className="mt-6 grid grid-cols-2">
            {stats.map((s, i) => (
              <div key={s.label} className={`py-5 ${i % 2 !== 0 ? "border-l border-navy-900/12 pl-5 dark:border-white/12" : ""} ${i >= 2 ? "border-t border-navy-900/12 dark:border-white/12" : ""}`}>
                <dt className="font-display text-2xl font-medium text-navy-900 dark:text-white">{s.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="lg:col-span-7">
          <SectionHeading eyebrow="Biography" title="A surgeon at the frontier of neuro & spine care" />
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
            <p>
              {doctor.name} is a distinguished neurosurgeon and spine surgeon based in Mumbai, serving as{" "}
              {doctor.role.toLowerCase()}. With more than {doctor.experienceYears} years of experience, he has performed
              over {doctor.brainSurgeries}+ brain tumor surgeries and {doctor.spineSurgeries}+ spine surgeries.
            </p>
            <p>
              His practice is defined by a minimally invasive philosophy — endoscopic brain and spine surgery, keyhole
              approaches and deep brain stimulation — that consistently delivers smaller scars, less pain and faster
              recovery for his patients.
            </p>
            <p>
              A prolific academic, he has authored {doctor.publications}{" "}
              peer-reviewed publications and two books, holds
              a patent, and chairs the Young Neurosurgical Forum and the Innovation &amp; Patent Cell at the
              Neurological Society of India.
            </p>
            <p>
              {doctor.name}, a highly experienced Senior Consultant in Neuro and Spine Surgery at Fortis Hospital,
              Mulund, boasts {doctor.experienceYears} years of expertise in minimally invasive endoscopic brain and
              spine surgeries. His credentials include an MBBS and MS in General Surgery from MPSMC, Saurashtra
              University, Gujarat, and an M.Ch. in Neurosurgery from SGPGIMS, Lucknow. {doctor.shortName}{" "}
              underwent
              comprehensive training in minimally invasive spine surgery techniques in Japan and South Korea. He is
              renowned for his research in craniovertebral junction spine surgery and complex spine deformity surgery,
              earning him accolades like the &ldquo;Best Young Neurosurgeon India&rdquo; award in 2016. With{" "}
              {doctor.publications} research publications, editorial roles, a patent, and active involvement in medical
              societies, he is a respected leader in his field.
            </p>
          </div>

          <h3 className="mt-12 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
            Training &amp; Career Milestones
          </h3>
          <div className="mt-6 border-t border-navy-900/12 dark:border-white/12">
            {timeline.map((t) => (
              <div key={t.title} className="grid gap-x-6 border-b border-navy-900/12 py-5 dark:border-white/12 sm:grid-cols-[4.5rem_1fr]">
                <span className="font-display text-sm font-medium tabular-nums text-teal-700/70 dark:text-teal-300/70">{t.year}</span>
                <div>
                  <h4 className="font-display text-lg font-medium text-navy-900 dark:text-white">{t.title}</h4>
                  <p className="mt-1 text-sm text-muted">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-12 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
            Hospital Affiliations
          </h3>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            {affiliations.map((a) => (
              <span key={a} className="text-sm font-medium text-navy-800 dark:text-white/80">{a}</span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
