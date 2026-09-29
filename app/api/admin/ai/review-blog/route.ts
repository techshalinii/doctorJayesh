import { NextResponse } from "next/server";
import { requireAdmin, UNAUTHORIZED } from "@/lib/admin/auth-server";
import { getAIProvider, AIError, aiErrorResponse } from "@/lib/ai";
import { loadProfile, readText } from "@/lib/ai/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

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

  const text = readText(body.body, 60000);
  if (!text) return NextResponse.json({ error: "There is nothing to review." }, { status: 400 });

  const profile = await loadProfile(session.db);

  let result;
  try {
    result = await provider.reviewCompleteBlog(text, profile, []);
  } catch (error) {
    console.error("[ai/review-blog] failed:", error);
    const { status, body: payload } = aiErrorResponse(error, "The review could not be run.");
    return NextResponse.json(payload, { status });
  }

  const blogId = readText(body.blogId, 64);
  if (blogId) {
    const { error } = await session.db.from("blog_ai_metadata").upsert(
      {
        blog_id: blogId,
        medical_review: result.medical.length === 0 ? "clean" : "flagged",
        medical_findings: result.medical,
        style_findings: [...result.style, ...result.originality, ...result.language],
        grammar_findings: result.grammar,
        provider: provider.info.provider,
        model: provider.info.model,
      },
      { onConflict: "blog_id" },
    );
    if (error) console.warn("[ai/review-blog] could not store review:", error.message);
  }

  return NextResponse.json({ review: result, provider: provider.info });
}
