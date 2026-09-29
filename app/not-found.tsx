import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="grid min-h-[70vh] place-items-center py-16">
      <Container className="text-center">
        <p className="font-display text-7xl font-semibold text-gradient sm:text-8xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-navy-900 sm:text-3xl dark:text-white">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button href="/">Back to Home</Button>
          <Button href="/appointment/" variant="secondary">Book an Appointment</Button>
        </div>
      </Container>
    </section>
  );
}
