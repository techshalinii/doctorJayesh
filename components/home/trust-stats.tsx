import { Container } from "@/components/ui/container";
import { trustStats } from "@/lib/data";

export function TrustStats() {
  return (
    <section className="border-b border-border" aria-label="Practice at a glance">
      <Container>
        <dl className="grid grid-cols-2 sm:grid-cols-4">
          {trustStats.map((s, i) => (
            <div
              key={s.label}
              className={`group px-2 py-7 sm:px-6 ${i !== 0 ? "sm:border-l sm:border-border" : ""} ${i % 2 !== 0 ? "border-l border-border sm:border-l" : ""} ${i >= 2 ? "border-t border-border sm:border-t-0" : ""}`}
            >
              <dt className="font-display text-3xl font-medium tracking-tight text-navy-900 transition-colors duration-300 group-hover:text-teal-700 sm:text-4xl dark:text-white dark:group-hover:text-teal-300">
                {s.value}
              </dt>
              <dd className="mt-1.5 text-xs font-medium uppercase tracking-wider text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
