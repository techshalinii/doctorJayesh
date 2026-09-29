import { NextResponse } from "next/server";
import { requireAdmin, UNAUTHORIZED } from "@/lib/admin/auth-server";
import { getAIProvider, AIError } from "@/lib/ai";
import { runBlogGeneration } from "@/lib/ai/pipeline";
import { loadCorpus, loadProfile, readSettings, readText, reservedSlugSet } from "@/lib/ai/request";
import { safeSlug } from "@/lib/cms/content-brain";
import { retrieveRelevant } from "@/lib/ai/retrieval";
import { toSlug } from "@/lib/cms/markdown-import";
import { PROMPT_VERSION } from "@/lib/ai/version";
import type { GenerationOutcome } from "@/lib/ai/pipeline";


const MAX_PER_RUN = 6;

const BETWEEN_ARTICLES_MS = 3000;

interface TopicInput {
  topic: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  category: string;
  candidateId?: string;
}

function readTopics(raw: unknown): TopicInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === "object")
    .map((t) => ({
      topic: readText(t.topic, 300),
      focusKeyword: readText(t.focusKeyword, 120),
      secondaryKeywords: Array.isArray(t.secondaryKeywords)
        ? t.secondaryKeywords.filter((k): k is string => typeof k === "string").slice(0, 12)
        : [],
      category: readText(t.category, 120),
      candidateId: readText(t.candidateId, 64) || undefined,
    }))
    .filter((t) => t.topic)
    .slice(0, MAX_PER_RUN);
}

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

  const topics = readTopics(body.topics);
  if (!topics.length) {
    return NextResponse.json({ error: "Select at least one topic first." }, { status: 400 });
  }

  const settings = readSettings(body.settings);
  const audience = readText(body.audience, 200);
  const instructions = readText(body.instructions, 2000);

  const { data: job } = await session.db
    .from("ai_jobs")
    .insert({
      kind: "monthly",
      status: "running",
      input: { topics: topics.map((t) => t.topic), settings },
      provider: provider.info.provider,
      model: provider.info.model,
      prompt_version: PROMPT_VERSION,
      created_by: session.userId,
    })
    .select("id")
    .single();

  const corpus = await loadCorpus(session.db);
  const profile = await loadProfile(session.db);
  const reserved = reservedSlugSet(corpus);

  const results: (GenerationOutcome & { topic: string; candidateId?: string })[] = [];

  for (const [index, topic] of topics.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, BETWEEN_ARTICLES_MS));

    try {
      const outcome = await runBlogGeneration({
        provider,
        corpus,
        request: {
          topic: topic.topic,
          category: topic.category,
          audience,
          instructions,
          focusKeyword: topic.focusKeyword,
          secondaryKeywords: topic.secondaryKeywords,
          settings,
          profile,
          references: retrieveRelevant(topic.topic, topic.focusKeyword, corpus),
          outline: null,
        },
      });

      if (outcome.blog) {
        outcome.blog.slug = safeSlug(toSlug(outcome.blog.slug || outcome.blog.title), reserved);
        reserved.add(outcome.blog.slug);
      }

      results.push({ ...outcome, topic: topic.topic, candidateId: topic.candidateId });
    } catch (error) {
      results.push({
        status: "failed",
        steps: [],
        blog: null,
        plan: null,
        duplicates: [],
        review: null,
        modelCalls: 0,
        error: error instanceof Error ? error.message : "Generation failed.",
        provider: provider.info,
        topic: topic.topic,
        candidateId: topic.candidateId,
      });
    }
  }

  const written = results.filter((r) => r.blog).length;
  const status = written === 0 ? "failed" : written < results.length ? "partial" : "succeeded";

  if (job) {
    await session.db
      .from("ai_jobs")
      .update({
        status,
        result: { generated: written, requested: results.length },
        error: results.filter((r) => !r.blog).map((r) => `${r.topic}: ${r.error}`).join(" | "),
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);
  }

  await session.db.from("ai_settings").update({ last_run_at: new Date().toISOString() }).eq("id", true);

  return NextResponse.json({ status, results, jobId: job?.id ?? null });
}
