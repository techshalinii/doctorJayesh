import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppointmentForm } from "@/components/forms/appointment-form";

export function BookAppointment() {
  return (
    <section className="py-12 lg:py-16" id="book_now">
      <Container className="max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="Appointments"
          title="Book Appointment"
          description="Take the first step towards better health. Schedule your appointment with our specialists."
        />
        <div className="home-appointment-form mt-8">
          <AppointmentForm variant="compact" />
        </div>
      </Container>
    </section>
  );
}
