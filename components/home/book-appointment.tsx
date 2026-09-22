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
    /* The form runs as a wide grid here rather than the default stack, so the band needs
       less height and less measure-limiting than it did: max-w-3xl could not fit four
       fields on a row, and the old py-16/py-20 was sized for a form twice as tall. */
    <section className="py-12 lg:py-16" id="book_now">
      {/* max-w-6xl, not the section default: at the full 1600px the paired fields stretch
          past 700px each. This lands them near 500px, the width the design calls for. */}
      <Container className="max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="Appointments"
          title="Book Appointment"
          description="Take the first step towards better health. Schedule your appointment with our specialists."
        />
        {/* `compact` is passed only here. /appointment/, /contact-us/ and <AppointmentCTA>
            render the same component with no prop and keep the stacked layout — the class
            below marks this instance as the one that owns the compact grid. */}
        <div className="home-appointment-form mt-8">
          <AppointmentForm variant="compact" />
        </div>
      </Container>
    </section>
  );
}
