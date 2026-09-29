import { NextResponse } from "next/server";
import { requireAdmin, UNAUTHORIZED } from "@/lib/admin/auth-server";
import { getAIProvider, AIError, AIRateLimitError, aiErrorResponse, providerLabel } from "@/lib/ai";
import { rateLimitCooldownIsDaily, rateLimitRemainingMs } from "@/lib/ai/cooldown";
import { attachSimilarity } from "@/lib/ai/pipeline";
import { loadCorpus, loadProfile, readText } from "@/lib/ai/request";
import { existingTitles } from "@/lib/cms/content-brain";
import { PROMPT_VERSION } from "@/lib/ai/version";
import { candidatePoolSize, selectBalancedTopics } from "@/lib/ai/topics";
import type { ScoredTopic } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  let provider;
  try {
    provider = getAIProvider();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AIError ? error.message : "No AI provider is configured." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (provider.info.provider !== "mock") {
    const cooling = rateLimitRemainingMs();
    if (cooling > 0) {
      const { status, body: payload } = aiErrorResponse(
        new AIRateLimitError("topics", cooling, rateLimitCooldownIsDaily(), providerLabel(provider.info.provider)),
        "",
      );
      return NextResponse.json(payload, { status });
    }
  }

  const requested = Number(body.count);
  const count = Number.isFinite(requested) ? Math.min(12, Math.max(1, Math.round(requested))) : 4;
  const pool = candidatePoolSize(count);

  const { data: job } = await session.db
    .from("ai_jobs")
    .insert({
      kind: "topics",
      status: "running",
      input: { count, pool },
      provider: provider.info.provider,
      model: provider.info.topicsModel ?? provider.info.model,
      prompt_version: PROMPT_VERSION,
      created_by: session.userId,
    })
    .select("id")
    .single();

  try {
    const corpus = await loadCorpus(session.db);
    const profile = await loadProfile(session.db);

    const { data: categoryRows } = await session.db
      .from("categories")
      .select("name")
      .order("sort_order");
    const categories = (categoryRows ?? []).map((c) => c.name as string);

    const candidates = await provider.generateTopicCandidates({
      count: pool,
      categories,
      profile,
      existingTitles: existingTitles(corpus),
      instructions: readText(body.instructions, 2000),
    });

    const shortlist = selectBalancedTopics(candidates, count);
    const shortlisted = new Set(shortlist.map((t) => t.topic));

    const similarity = attachSimilarity(candidates, corpus);
    const scored: ScoredTopic[] = candidates.map((candidate, i) => ({
      ...candidate,
      similar: similarity[i],
    }));

    const batchId = crypto.randomUUID();
    const { error: saveError } = await session.db.from("topic_candidates").insert(
      scored.map((c) => ({
        batch_id: batchId,
        topic: c.topic,
        focus_keyword: c.focusKeyword,
        secondary_keywords: c.secondaryKeywords,
        intent: c.intent,
        content_gap: c.contentGap,
        reason: c.reason,
        ai_estimate: c.aiEstimate,
        category: c.category,
        similar: c.similar,
        selected: shortlisted.has(c.topic),
        created_by: session.userId,
      })),
    );
    if (saveError) console.warn("[ai/generate-topics] could not save candidates:", saveError.message);

    if (job) {
      await session.db
        .from("ai_jobs")
        .update({
          status: "succeeded",
          result: { batchId, proposed: scored.length, shortlisted: shortlist.length },
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    return NextResponse.json({
      batchId,
      candidates: scored,
      shortlist: shortlist.map((t) => t.topic),
      jobId: job?.id ?? null,
    });
  } catch (error) {
    const message = error instanceof AIError ? error.message : error instanceof Error ? error.message : "Topic research failed.";
    console.error("[ai/generate-topics] failed:", error);

    if (job) {
      await session.db
        .from("ai_jobs")
        .update({ status: "failed", error: message, finished_at: new Date().toISOString() })
        .eq("id", job.id);
    }

    const { status, body: payload } = aiErrorResponse(error, "Topic research failed.");
    return NextResponse.json(payload, { status });
  }
}
