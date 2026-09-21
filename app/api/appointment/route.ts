import { NextResponse } from "next/server";

/**
 * Appointment request -> email.
 *
 * Until this route existed, <AppointmentForm> called preventDefault(), waited 1100ms on a
 * setTimeout and showed "Request received. Our care team will call you shortly." Nothing
 * was sent anywhere; every submission was discarded. On a site whose service list includes
 * "Second Opinion" that is worse than having no form at all, because the patient believes
 * a clinic now holds their details.
 *
 * Resend is called over its REST API with plain fetch rather than the `resend` package —
 * one POST, no dependency to keep current.
 *
 * The route never reports success it cannot back up: if the key is missing or Resend
 * rejects the send, it returns an error and the form surfaces it with the practice's phone
 * number. A silent failure here reintroduces the original bug in a subtler form.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Overridable so staging can divert mail without a code change. The default is the
 * practice's address, so a deploy that sets only RESEND_API_KEY still works.
 */
const TO = process.env.APPOINTMENT_TO ?? "nextdot.agency@gmail.com";

/**
 * Resend refuses any `from` outside a verified domain. `onboarding@resend.dev` is their
 * shared sender, which only delivers to the Resend account owner's own address — fine when
 * that account is the destination inbox, but set APPOINTMENT_FROM to an address on a
 * verified domain before pointing TO anywhere else.
 */
const FROM = process.env.APPOINTMENT_FROM ?? "Appointments <onboarding@resend.dev>";

const LIMITS = { name: 120, phone: 40, email: 160, service: 80, date: 40, message: 4000 } as const;

type Field = keyof typeof LIMITS;

function clean(value: unknown, field: Field): string {
  if (typeof value !== "string") return "";
  // Strip control characters so nothing can inject extra header-looking lines.
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, LIMITS[field]);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  // Honeypot: a field hidden from people but filled by most naive bots. Answer 200 so the
  // bot sees success and does not retry, while nothing is sent.
  if (clean(body.company, "name")) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, "name");
  const phone = clean(body.phone, "phone");
  const email = clean(body.email, "email");
  const service = clean(body.service, "service");
  const date = clean(body.date, "date");
  const message = clean(body.message, "message");

  // Mirrors the `required` attributes on the form; a POST that skips the browser still
  // has to satisfy them.
  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: "Name and phone are required." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email address looks wrong." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Loud on the server, vague to the visitor — they cannot act on a missing deploy key.
    console.error("[appointment] RESEND_API_KEY is not set; submission was not delivered.");
    return NextResponse.json(
      { ok: false, error: "We could not send your request just now. Please call us instead." },
      { status: 503 },
    );
  }

  const lines = [
    `Name:    ${name}`,
    `Phone:   ${phone}`,
    `Email:   ${email || "(not given)"}`,
    `Service: ${service || "(not selected)"}`,
    `Date:    ${date || "(no preference)"}`,
    "",
    "Message:",
    message ? message.replace(/^/gm, "  ") : "  (none)",
    "",
    `Submitted ${new Date().toISOString()}`,
  ];

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        // So hitting Reply in the inbox goes to the patient, not to the sender address.
        ...(email ? { reply_to: email } : {}),
        subject: `Appointment request — ${name}${service ? ` (${service})` : ""}`,
        text: lines.join("\n"),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[appointment] Resend rejected the send:", res.status, detail.slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "We could not send your request just now. Please call us instead." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[appointment] Could not reach Resend:", err);
    return NextResponse.json(
      { ok: false, error: "We could not send your request just now. Please call us instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
