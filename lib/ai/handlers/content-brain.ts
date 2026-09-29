import { NextResponse } from "next/server";
import { requireAdmin, UNAUTHORIZED } from "@/lib/admin/auth-server";
import { getAIProvider, AIError } from "@/lib/ai";
import { loadCorpus } from "@/lib/ai/request";
import { analysisSample, ANALYSIS_SAMPLE_SIZE, markdownCorpus } from "@/lib/cms/content-brain";


export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const { data, error } = await session.db
    .from("content_profiles")
    .select("id,profile,markdown_posts,supabase_posts,provider,model,created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const missing = /schema cache|does not exist/i.test(error.message);
    return NextResponse.json(
      {
        error: missing
          ? "The content brain table does not exist yet. Run supabase/migrations/0003_ai_generator.sql in the Supabase SQL editor, then reload."
          : `Could not read the content brain: ${error.message}`,
        setupRequired: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  const markdown = markdownCorpus().length;
  const { count } = await session.db
    .from("blogs")
    .select("id", { count: "exact", head: true })
    .neq("status", "archived");
  const sources = { markdown, supabase: count ?? 0, total: markdown + (count ?? 0) };

  let provider: { provider: string; model: string; live: boolean };
  try {
    const active = getAIProvider();
    provider = { ...active.info, live: active.info.provider !== "mock" };
  } catch (err) {
    return NextResponse.json({
      profile: data ?? null,
      sources,
      provider: { provider: "unconfigured", model: "", live: false },
      providerError: err instanceof AIError ? err.message : String(err),
    });
  }

  return NextResponse.json({ profile: data ?? null, sources, provider });
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

  const started = new Date().toISOString();

  try {
    const corpus = await loadCorpus(session.db);
    if (!corpus.length) {
      return NextResponse.json({ error: "There is no content to analyse yet." }, { status: 400 });
    }

    const sample = analysisSample(corpus, ANALYSIS_SAMPLE_SIZE);
    const profile = await provider.analyseBlogs(sample);

    const { data, error } = await session.db
      .from("content_profiles")
      .insert({
        profile,
        markdown_posts: profile.stats.markdownPosts,
        supabase_posts: profile.stats.supabasePosts,
        provider: provider.info.provider,
        model: provider.info.model,
        note: `Analysed ${sample.length} of ${corpus.length} articles.`,
        created_by: session.userId,
      })
      .select("id,profile,markdown_posts,supabase_posts,provider,model,created_at")
      .single();

    if (error) {
      const missing = /schema cache|does not exist/i.test(error.message);
      return NextResponse.json(
        {
          error: missing
            ? "The analysis ran, but there is nowhere to store it: run supabase/migrations/0003_ai_generator.sql, then refresh again."
            : `Analysis succeeded but could not be saved: ${error.message}`,
          setupRequired: missing,
        },
        { status: missing ? 503 : 500 },
      );
    }

    await session.db.from("ai_jobs").insert({
      kind: "profile",
      status: "succeeded",
      input: { sampled: sample.length, total: corpus.length },
      steps: [{ key: "analyse", label: "Analysing existing articles", state: "done" }],
      provider: provider.info.provider,
      model: provider.info.model,
      created_by: session.userId,
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json({ profile: data, sampled: sample.length, total: corpus.length });
  } catch (error) {
    const message = error instanceof AIError ? error.message : error instanceof Error ? error.message : "Analysis failed.";
    console.error("[ai/content-brain] analysis failed:", error);

    await session.db.from("ai_jobs").insert({
      kind: "profile",
      status: "failed",
      error: message,
      provider: provider.info.provider,
      model: provider.info.model,
      created_by: session.userId,
      input: { started },
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
