import { NextResponse } from "next/server";
import { requireAdmin, UNAUTHORIZED } from "@/lib/admin/auth-server";
import { getAIProvider, AIError, aiErrorResponse } from "@/lib/ai";
import { loadCorpus, loadProfile, readText } from "@/lib/ai/request";
import { findSimilar } from "@/lib/ai/similarity";
import { existingTitles } from "@/lib/cms/content-brain";
import { AI_ESTIMATE_DISCLAIMER } from "@/lib/ai/labels";


export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topic = readText(body.topic, 300);
  if (!topic) return NextResponse.json({ error: "A topic is required." }, { status: 400 });

  const keyword = readText(body.focusKeyword, 120);
  const corpus = await loadCorpus(session.db);

  if (body.mode === "duplicates") {
    return NextResponse.json({ duplicates: findSimilar(topic, keyword, corpus) });
  }

  let provider;
  try {
    provider = getAIProvider();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AIError ? error.message : "No AI provider is configured." },
      { status: 503 },
    );
  }

  try {
    const profile = await loadProfile(session.db);

    const candidates = await provider.generateTopicCandidates({
      count: 3,
      categories: readText(body.category, 120) ? [readText(body.category, 120)] : [],
      profile,
      existingTitles: existingTitles(corpus, 60),
      instructions: `Every suggestion must be an angle on this exact topic: "${topic}". Do not propose different subjects.`,
    });

    const primary = candidates[0];
    const secondary = [...new Set(candidates.flatMap((c) => c.secondaryKeywords))].slice(0, 10);

    return NextResponse.json({
      focusKeyword: keyword || primary?.focusKeyword || "",
      secondaryKeywords: secondary,
      angles: candidates,
      duplicates: findSimilar(topic, keyword || primary?.focusKeyword || "", corpus),
      disclaimer: AI_ESTIMATE_DISCLAIMER,
    });
  } catch (error) {
    console.error("[ai/research-topics] failed:", error);
    const { status, body: payload } = aiErrorResponse(error, "Keyword research failed.");
    return NextResponse.json(payload, { status });
  }
}
