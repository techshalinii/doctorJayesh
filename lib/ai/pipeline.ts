import { findSimilar } from "./similarity";
import { AIError } from "./types";
import type {
  AIProvider,
  BlogPlan,
  BlogRequest,
  CombinedReview,
  CorpusItem,
  DuplicateMatch,
  GeneratedBlog,
} from "./types";

export type StepState = "pending" | "running" | "done" | "failed" | "skipped";

export interface JobStep {
  key: string;
  label: string;
  state: StepState;
  note?: string;
}

export const BLOG_STEPS: { key: string; label: string }[] = [
  { key: "input", label: "Analysing topic" },
  { key: "duplicates", label: "Checking existing content" },
  { key: "profile", label: "Loading content brain" },
  { key: "outline", label: "Creating outline" },
  { key: "blog", label: "Writing article" },
  { key: "seo", label: "Generating SEO" },
  { key: "images", label: "Generating image suggestions" },
  { key: "grammar", label: "Grammar check" },
  { key: "style", label: "Style check" },
  { key: "medical", label: "Medical claim check" },
];

export interface GenerationOutcome {
  status: "succeeded" | "partial" | "failed";
  steps: JobStep[];
  blog: GeneratedBlog | null;
  plan: BlogPlan | null;
  duplicates: DuplicateMatch[];
  review: CombinedReview | null;
  error: string;
  provider: { provider: string; model: string };
  modelCalls: number;
}

class Steps {
  private readonly list: JobStep[] = BLOG_STEPS.map((s) => ({ ...s, state: "pending" }));

  start(key: string) { this.set(key, "running"); }
  done(...keys: string[]) { for (const key of keys) this.set(key, "done"); }
  fail(key: string, note: string) { this.set(key, "failed", note); }
  skip(key: string, note: string) { this.set(key, "skipped", note); }
  failAll(keys: string[], note: string) { for (const key of keys) this.set(key, "failed", note); }

  private set(key: string, state: StepState, note?: string) {
    const step = this.list.find((s) => s.key === key);
    if (step) {
      step.state = state;
      if (note) step.note = note;
    }
  }

  snapshot(): JobStep[] {
    return this.list.map((s) => ({ ...s }));
  }
}

function messageOf(error: unknown): string {
  if (error instanceof AIError) return error.message;
  return error instanceof Error ? error.message : String(error);
}

export interface RunBlogInput {
  provider: AIProvider;
  request: BlogRequest;
  corpus: CorpusItem[];
  review?: boolean;
}

export async function runBlogGeneration({
  provider,
  request,
  corpus,
  review = true,
}: RunBlogInput): Promise<GenerationOutcome> {
  const steps = new Steps();
  const outcome: GenerationOutcome = {
    status: "failed",
    steps: steps.snapshot(),
    blog: null,
    plan: null,
    duplicates: [],
    review: null,
    error: "",
    provider: provider.info,
    modelCalls: 0,
  };

  steps.start("input");
  if (!request.topic.trim()) {
    steps.fail("input", "No topic given.");
    return { ...outcome, steps: steps.snapshot(), error: "A topic is required." };
  }
  steps.done("input");

  steps.start("duplicates");
  outcome.duplicates = findSimilar(request.topic, request.focusKeyword, corpus);
  steps.done("duplicates");

  steps.start("profile");
  if (request.profile) steps.done("profile");
  else steps.skip("profile", "No content brain yet — generating without house style.");

  steps.start("outline");
  let plan: BlogPlan | null = null;
  try {
    plan = await provider.generateBlogPlan(request);
    outcome.modelCalls++;
    outcome.plan = plan;
    steps.done("outline");
  } catch (error) {
    outcome.modelCalls++;
    steps.fail("outline", messageOf(error));
  }

  steps.start("blog");
  let blog: GeneratedBlog;
  try {
    blog = await provider.generateCompleteBlog(request, plan);
    outcome.modelCalls++;
    steps.done("blog");
  } catch (error) {
    outcome.modelCalls++;
    steps.fail("blog", messageOf(error));
    steps.failAll(["seo", "images"], "Not reached — the article could not be written.");
    return { ...outcome, steps: steps.snapshot(), status: "failed", error: messageOf(error) };
  }

  steps.start("seo");
  if (blog.metaTitle && blog.metaDescription) steps.done("seo");
  else steps.skip("seo", "Came back incomplete — fill it in with the editor's SEO panel.");

  steps.start("images");
  if (!request.settings.includeImageSuggestions) {
    steps.skip("images", "Turned off for this generation.");
  } else if (blog.imageSuggestions.length) {
    steps.done("images");
  } else {
    steps.skip("images", "None came back with the article.");
  }

  outcome.blog = blog;

  const reviewSteps = ["grammar", "style", "medical"];
  if (!review) {
    for (const key of reviewSteps) steps.skip(key, "AI review is off for this generation.");
  } else {
    steps.start("grammar");
    try {
      outcome.review = await provider.reviewCompleteBlog(
        blog.contentMarkdown,
        request.profile,
        request.references.map((r) => ({ title: r.title, extract: r.extract })),
      );
      outcome.modelCalls++;
      steps.done(...reviewSteps);
    } catch (error) {
      outcome.modelCalls++;
      steps.failAll(reviewSteps, messageOf(error));
    }
  }

  const snapshot = steps.snapshot();
  const failures = snapshot.filter((s) => s.state === "failed");

  return {
    ...outcome,
    steps: snapshot,
    status: failures.length ? "partial" : "succeeded",
    error: failures.length
      ? `${failures.length} step(s) failed: ${failures.map((f) => f.label).join(", ")}.`
      : "",
  };
}

export function attachSimilarity(
  candidates: { topic: string; focusKeyword: string }[],
  corpus: CorpusItem[],
): DuplicateMatch[][] {
  return candidates.map((c) => findSimilar(c.topic, c.focusKeyword, corpus, 3));
}
