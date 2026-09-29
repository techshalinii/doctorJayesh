import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TO = process.env.APPOINTMENT_TO?.trim() || "nextdot.agency@gmail.com";

const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(TO)}`;

const LIMITS = { name: 120, phone: 40, email: 160, service: 80, date: 40, message: 4000 } as const;

type Field = keyof typeof LIMITS;

function clean(value: unknown, field: Field): string {
  if (typeof value !== "string") return "";
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

  if (clean(body.company, "name")) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, "name");
  const phone = clean(body.phone, "phone");
  const email = clean(body.email, "email");
  const service = clean(body.service, "service");
  const date = clean(body.date, "date");
  const message = clean(body.message, "message");

  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: "Name and phone are required." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email address looks wrong." }, { status: 400 });
  }

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

  if (email) payload._replyto = email;

  try {
    const res = await fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: SITE_URL,
        Referer: `${SITE_URL}/appointment/`,
      },
      body: JSON.stringify(payload),
    });

    const result: { success?: boolean | string; message?: string } = await res
      .json()
      .catch(() => ({}));

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
