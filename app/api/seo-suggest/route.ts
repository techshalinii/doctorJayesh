import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  buildSuggestPrompt,
  rankSuggestions,
  suggestMetaDescriptions,
  suggestSeoTitles,
  type SuggestOption,
} from "@/lib/cms/seo-suggest";
import type { ScoreContext } from "@/lib/cms/seo-score";
import { CMS_ENABLED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Rewrite options for the SEO Suggest panel.
 *
 * The model, when one is configured, only ever proposes WORDING. Every option it
 * returns is re-scored by lib/cms/seo-score.ts before this route replies, and an
 * option that fails the rules is ranked below one that passes — so a suggestion can
 * never arrive with a claim the rules do not support.
 *
 * With no API key the deterministic generator answers instead. It needs no network
 * and produces options built from the post's own title, excerpt and focus keyword,
 * so the panel is never empty and never blocks on a third party.
 *
 * Runs server-side precisely so the API key stays server-side: the browser posts the
 * post's fields and receives finished options.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** A refusal or a network failure must degrade to templates, never to an error page. */
async function askClaude(prompt: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    // Rewriting one line against a stated rule set is a light task, and the panel is
    // interactive — low effort keeps it responsive without changing what passes.
    output_config: { effort: "low" },
    system:
      "You write SEO metadata for a neurosurgery practice's website. You follow the " +
      "stated character limits exactly and never use marketing hyperbole or medical " +
      "claims the page does not support. Output only the requested lines.",
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") return [];

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .flatMap((block) => block.text.split("\n"))
    .map((line) => line.replace(/^\s*(?:[-*\d.)\s]+)?\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

async function askGemini(prompt: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!response.ok) return [];

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*\d.)\s]+)?\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

async function isSignedIn(token: string): Promise<boolean> {
  if (!CMS_ENABLED || !token) return false;
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.getUser(token);
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

interface SuggestRequest {
  kind?: unknown;
  context?: unknown;
}

export async function POST(request: Request) {
  // The editor is behind a login and this route spends money, so it is gated on the
  // same session the dashboard already holds.
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!(await isSignedIn(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SuggestRequest;
  try {
    body = (await request.json()) as SuggestRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const kind = body.kind === "title" || body.kind === "description" ? body.kind : null;
  const raw = body.context as Partial<ScoreContext> | undefined;
  if (!kind || !raw || typeof raw.focusKeyword !== "string" || !raw.focusKeyword.trim()) {
    return NextResponse.json(
      { error: "A focus keyword is required before suggestions can be generated." },
      { status: 400 },
    );
  }

  const ctx: ScoreContext = {
    pageTitle: typeof raw.pageTitle === "string" ? raw.pageTitle : "",
    focusKeyword: raw.focusKeyword,
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
    otherTitles: Array.isArray(raw.otherTitles)
      ? raw.otherTitles.filter((t): t is string => typeof t === "string").slice(0, 500)
      : [],
    otherDescriptions: Array.isArray(raw.otherDescriptions)
      ? raw.otherDescriptions.filter((d): d is string => typeof d === "string").slice(0, 500)
      : [],
  };

  let options: SuggestOption[] = [];
  let source: "ai" | "template" = "template";

  try {
    const prompt = buildSuggestPrompt(kind, ctx);
    const lines = (await askClaude(prompt)) ?? [];
    const texts = lines.length ? lines : await askGemini(prompt);
    if (texts.length) {
      options = rankSuggestions(kind, texts, ctx);
      if (options.length) source = "ai";
    }
  } catch (error) {
    // Logged, not surfaced: the author gets template options instead of an error.
    console.error("[seo-suggest] model call failed, using templates:", error);
  }

  if (!options.length) {
    options = kind === "title" ? suggestSeoTitles(ctx) : suggestMetaDescriptions(ctx);
  }

  return NextResponse.json({ source, options });
}
