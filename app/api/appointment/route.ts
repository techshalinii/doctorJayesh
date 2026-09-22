import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/supabase/config";

/**
 * Appointment request -> email, via FormSubmit (https://formsubmit.co).
 *
 * Until this route existed, <AppointmentForm> called preventDefault(), waited 1100ms on a
 * setTimeout and showed "Request received. Our care team will call you shortly." Nothing
 * was sent anywhere; every submission was discarded. On a site whose service list includes
 * "Second Opinion" that is worse than having no form at all, because the patient believes
 * a clinic now holds their details.
 *
 * FormSubmit needs no API key and no verified sending domain — it relays to the inbox named
 * in the endpoint path. This route calls its `/ajax/` endpoint server-side rather than
 * pointing the <form> action at it, so the honeypot, the length caps and the field
 * validation below still run on a POST that skips the browser, and the browser never has to
 * deal with FormSubmit's CORS or its redirect-based non-AJAX flow.
 *
 * ACTIVATION: the very first submission to a new address makes FormSubmit email that
 * address a confirmation link. Nothing is delivered until someone clicks it — so after
 * deploying (or after changing APPOINTMENT_TO) submit the form once and confirm from the
 * inbox. Until then FormSubmit answers 200 with `success: "false"` and the activation
 * message, which this route treats as the failure it is: the visitor sees the phone-number
 * fallback rather than a confirmation for mail nobody received. Switching APPOINTMENT_TO
 * to the hashed token FormSubmit issues after activation keeps the address out of the
 * request URL.
 *
 * The route never reports success it cannot back up: if FormSubmit rejects the relay, it
 * returns an error and the form surfaces it with the practice's phone number. A silent
 * failure here reintroduces the original bug in a subtler form.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Overridable so staging can divert mail without a code change. Accepts either the
 * destination address or the hashed token FormSubmit issues once it is activated.
 */
const TO = process.env.APPOINTMENT_TO ?? "shalini09142@gmail.com";

const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(TO)}`;

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

  /**
   * Keys become the labels in the email FormSubmit composes, so they are written the way
   * the practice should read them. The `_`-prefixed ones are FormSubmit's own controls:
   * `_subject` names the thread, `_template: "table"` lays the fields out as a table, and
   * `_captcha: "false"` skips the challenge page — which the non-AJAX flow shows to the
   * visitor and which a server-side POST could never satisfy anyway.
   */
  const payload: Record<string, string> = {
    _subject: `Appointment request — ${name}${service ? ` (${service})` : ""}`,
    _template: "table",
    _captcha: "false",
    Name: name,
    Phone: phone,
    Email: email || "(not given)",
    Service: service || "(not selected)",
    "Preferred date": date || "(no preference)",
    Message: message || "(none)",
    Submitted: new Date().toISOString(),
  };

  // So hitting Reply in the inbox goes to the patient, not to FormSubmit's relay address.
  if (email) payload._replyto = email;

  try {
    const res = await fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        /**
         * Required. FormSubmit rejects a request with no origin — "Make sure you open this
         * page through a web server, FormSubmit will not work in pages browsed as HTML
         * files" — and a server-side fetch sends none unless it is set here. Verified
         * against the live endpoint: without these two the relay never happens.
         */
        Origin: SITE_URL,
        Referer: `${SITE_URL}/appointment/`,
      },
      body: JSON.stringify(payload),
    });

    const result: { success?: boolean | string; message?: string } = await res
      .json()
      .catch(() => ({}));

    // FormSubmit has returned `success` as both the boolean and the string "true"; accept
    // either, and treat anything else as a failure rather than assuming delivery.
    const delivered = res.ok && String(result.success) === "true";

    if (!delivered) {
      console.error(
        "[appointment] FormSubmit rejected the relay:",
        res.status,
        (result.message ?? "").slice(0, 500),
      );
      return NextResponse.json(
        { ok: false, error: "We could not send your request just now. Please call us instead." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[appointment] Could not reach FormSubmit:", err);
    return NextResponse.json(
      { ok: false, error: "We could not send your request just now. Please call us instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
