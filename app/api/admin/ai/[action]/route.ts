import { NextResponse } from "next/server";
import * as contentBrain from "@/lib/ai/handlers/content-brain";
import * as generateBlog from "@/lib/ai/handlers/generate-blog";
import * as generateTopics from "@/lib/ai/handlers/generate-topics";
import * as monthlyRun from "@/lib/ai/handlers/monthly-run";
import * as researchTopics from "@/lib/ai/handlers/research-topics";
import * as reviewBlog from "@/lib/ai/handlers/review-blog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

type Handler = (request: Request) => Promise<Response>;

const HANDLERS: Record<string, { GET?: Handler; POST?: Handler }> = {
  "content-brain": contentBrain,
  "generate-blog": generateBlog,
  "generate-topics": generateTopics,
  "monthly-run": monthlyRun,
  "research-topics": researchTopics,
  "review-blog": reviewBlog,
};

type Context = { params: Promise<{ action: string }> };

async function dispatch(method: "GET" | "POST", request: Request, { params }: Context) {
  const { action } = await params;
  const handlers = Object.hasOwn(HANDLERS, action) ? HANDLERS[action] : undefined;
  if (!handlers) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const handler = handlers[method];
  if (!handler) {
    return NextResponse.json(
      { error: "Method not allowed." },
      { status: 405, headers: { Allow: Object.keys(handlers).join(", ") } },
    );
  }
  return handler(request);
}

export function GET(request: Request, context: Context) {
  return dispatch("GET", request, context);
}

export function POST(request: Request, context: Context) {
  return dispatch("POST", request, context);
}
