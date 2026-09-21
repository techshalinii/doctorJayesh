import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppointmentForm } from "@/components/forms/appointment-form";

/**
 * Section 4 of the live WordPress homepage — the on-page booking form.
 *
 * The hero CTA targets `#book_now`, so this id must stay.
 *
 * TODO: the original was WPForms Lite form_id 138. Its field definitions live in the plugin's
 * own database tables and are NOT in the WXR export, so the exact field list could not be
 * migrated. This renders the existing AppointmentForm component instead — confirm its fields
 * against the live form before launch.
 */
export function BookAppointment() {
  return (
    <section className="border-t border-border py-16 lg:py-20" id="book_now">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="Appointments" title="Book Appointment" />
        <div className="mt-10">
          <AppointmentForm />
        </div>
      </Container>
    </section>
  );
}
