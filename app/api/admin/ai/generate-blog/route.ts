import { NextResponse } from "next/server";
import { requireAdmin, UNAUTHORIZED } from "@/lib/admin/auth-server";
import { getAIProvider, AIError, aiErrorResponse } from "@/lib/ai";
import { runBlogGeneration } from "@/lib/ai/pipeline";
import { loadCorpus, loadProfile, readList, readSettings, readText, reservedSlugSet } from "@/lib/ai/request";
import { safeSlug } from "@/lib/cms/content-brain";
import { retrievalBreakdown, retrieveRelevant } from "@/lib/ai/retrieval";
import { toSlug } from "@/lib/cms/markdown-import";
import { PROMPT_VERSION } from "@/lib/ai/version";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

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

  const topic = readText(body.topic, 300);
  if (!topic) {
    return NextResponse.json({ error: "A topic is required." }, { status: 400 });
  }

  const settings = readSettings(body.settings);
  const category = readText(body.category, 120);
  const focusKeyword = readText(body.focusKeyword, 120);

  const { data: job } = await session.db
    .from("ai_jobs")
    .insert({
      kind: "blog",
      status: "running",
      input: { topic, category, focusKeyword, settings },
      provider: provider.info.provider,
      model: provider.info.model,
      prompt_version: PROMPT_VERSION,
      created_by: session.userId,
    })
    .select("id")
    .single();

  try {
    const corpus = await loadCorpus(session.db);
    const profile = await loadProfile(session.db);

    const references = retrieveRelevant(topic, focusKeyword, corpus);

    const outcome = await runBlogGeneration({
      provider,
      corpus,
      review: body.review !== false,
      request: {
        topic,
        category,
        audience: readText(body.audience, 200),
        instructions: readText(body.instructions, 2000),
        focusKeyword,
        secondaryKeywords: readList(body.secondaryKeywords, 120, 12),
        settings,
        profile,
        references,
        outline: null,
      },
    });

    if (outcome.blog) {
      const reserved = reservedSlugSet(corpus);
      outcome.blog.slug = safeSlug(toSlug(outcome.blog.slug || outcome.blog.title), reserved);
    }

    if (job) {
      await session.db
        .from("ai_jobs")
        .update({
          status: outcome.status,
          steps: outcome.steps,
          error: outcome.error,
          result: outcome.blog
            ? {
                title: outcome.blog.title,
                slug: outcome.blog.slug,
                retrieved: retrievalBreakdown(references),
                modelCalls: outcome.modelCalls,
              }
            : null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    if (outcome.status === "failed") {
      return NextResponse.json({ ...outcome, jobId: job?.id ?? null }, { status: 502 });
    }

    return NextResponse.json({
      ...outcome,
      references,
      retrieved: retrievalBreakdown(references),
      jobId: job?.id ?? null,
    });
  } catch (error) {
    const message = error instanceof AIError ? error.message : error instanceof Error ? error.message : "Generation failed.";
    console.error("[ai/generate-blog] failed:", error);

    if (job) {
      await session.db
        .from("ai_jobs")
        .update({ status: "failed", error: message, finished_at: new Date().toISOString() })
        .eq("id", job.id);
    }

    const { status, body: payload } = aiErrorResponse(error, "Generation failed.");
    return NextResponse.json({ ...payload, jobId: job?.id ?? null }, { status });
  }
}
