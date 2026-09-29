import "server-only";

import { z } from "zod";
import { buildAnalysePrompt, buildBlogPrompt, buildTopicResearchPrompt } from "./prompts";
import { buildPlanningPrompt } from "./prompts/planning";
import { buildCombinedReviewPrompt } from "./prompts/review";
import {
  combinedReviewSchema,
  contentProfileSchema,
  generatedBlogSchema,
  planningSchema,
  topicCandidatesSchema,
} from "./schemas";
import { AIError, AIRateLimitError, AIUnavailableError } from "./types";
import { rateLimitCooldownIsDaily, rateLimitRemainingMs, startRateLimitCooldown } from "./cooldown";
import {
  decideRetry,
  DEFAULT_RATE_LIMIT_COOLDOWN_MS,
  isDailyQuota,
  msUntilDailyReset,
  parseGeminiError,
  readRetryAfter,
} from "./retry-policy";
import type {
  AIProvider,
  BlogPlan,
  BlogRequest,
  CombinedReview,
  ContentProfile,
  CorpusItem,
  GeneratedBlog,
  ProviderInfo,
  TopicCandidate,
  TopicRequest,
} from "./types";
import {
  BLOG_SCHEMA,
  PLAN_SCHEMA,
  PROFILE_SCHEMA,
  REVIEW_SCHEMA,
  safeJson,
  TOPIC_SCHEMA,
  withStats,
  type ResponseSchema,
} from "./shapes";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_MODEL = "gemini-flash-latest";

const REQUEST_TIMEOUT_MS = 120_000;

let requestCounter = 0;

const MAX_ATTEMPTS = 2;

const TEMPERATURE = { prose: 0.95, structured: 0.4 } as const;

const RECITATION_ESCALATION = [
  { temperature: 1.0, dropReferences: false },
  { temperature: 1.0, dropReferences: true },
] as const;

const BUDGET = {
  analyse: 32768,
  topics: 16384,
  plan: 16384,
  blog: 32768,
  review: 16384,
} as const;

export class GeminiProvider implements AIProvider {
  readonly info: ProviderInfo;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly topicsModel: string;
  private truncated = false;

  constructor(apiKey: string, model?: string, topicsModel?: string) {
    if (!apiKey) throw new AIError("GEMINI_API_KEY is not set.", "config");
    this.apiKey = apiKey;

    this.model = model?.trim() || process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
    this.topicsModel = topicsModel?.trim() || process.env.GEMINI_TOPICS_MODEL?.trim() || this.model;
    this.info = { provider: "gemini", model: this.model, topicsModel: this.topicsModel };
  }

  private modelFor(step: string): string {
    return step === "topics" ? this.topicsModel : this.model;
  }

  private async call<T>(
    step: string,
    prompt: string,
    schema: ResponseSchema,
    validator: z.ZodType<T>,
    maxOutputTokens = 8192,
    temperature: number = TEMPERATURE.structured,
  ): Promise<T> {
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const text = attempt === 1 ? prompt : `${prompt}\n\nYour previous reply was rejected: ${lastError}\nReturn valid JSON matching the schema exactly.`;

      let raw: string;
      try {
        raw = await this.fetchJson(step, text, schema, maxOutputTokens, temperature);
      } catch (error) {
        throw error instanceof AIError ? error : new AIError(String(error), step, error);
      }

      const parsed = safeJson(raw);
      if (!parsed.ok) {
        lastError = parsed.error;
        continue;
      }

      const result = validator.safeParse(parsed.value);
      if (result.success) return result.data;

      console.warn(`[AI] ${step} reply failed validation; this costs one more request`);
      lastError = result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
    }

    throw new AIError(
      this.truncated
        ? `Gemini ran out of output budget mid-answer, so the reply was incomplete (${lastError}). ` +
          `This step needs a larger BUDGET entry rather than a retry.`
        : `The model's reply did not match the expected shape after ${MAX_ATTEMPTS} attempts (${lastError}).`,
      step,
    );
  }

  private async fetchJson(
    step: string,
    prompt: string,
    schema: ResponseSchema,
    maxOutputTokens: number,
    temperature: number = TEMPERATURE.structured,
    recitationStep = 0,
  ): Promise<string> {
    const { response, requestId, startedAt } = await this.send(step, prompt, {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature,
      maxOutputTokens,
    });

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        finishReason?: string;
        citationMetadata?: { citationSources?: unknown[] };
        safetyRatings?: { category?: string; probability?: string }[];
      }[];
      promptFeedback?: { blockReason?: string };
      usageMetadata?: { totalTokenCount?: number };
    };

    if (data.promptFeedback?.blockReason) {
      throw new AIError(`Gemini blocked the prompt (${data.promptFeedback.blockReason}).`, step);
    }

    const answer = data.candidates?.[0];
    const text = answer?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    console.log(
      `[AI] #${requestId} ${step} END status=200 finish=${answer?.finishReason ?? "?"} ` +
        `chars=${text.length} tokens=${data.usageMetadata?.totalTokenCount ?? "?"} ` +
        `${Date.now() - startedAt}ms`,
    );

    if (answer?.finishReason === "RECITATION" && !text) {
      const next = RECITATION_ESCALATION[recitationStep];
      if (next) {
        console.warn(
          `[gemini] RECITATION on ${step}; retrying at temperature ${next.temperature}` +
            `${next.dropReferences ? " without reference articles" : ""}`,
        );
        return this.fetchJson(
          step,
          next.dropReferences ? stripReferences(prompt) : prompt,
          schema,
          maxOutputTokens,
          next.temperature,
          recitationStep + 1,
        );
      }
      throw new AIError(
        "Gemini stopped with RECITATION: it judged its own output to be reproducing existing " +
          "text, and returned nothing. Common on heavily-covered medical topics. It was retried " +
          "at a higher temperature and again without the reference articles — try a narrower " +
          "topic or a different angle.",
        step,
      );
    }

    if (!text) {
      throw new AIError(
        `Gemini returned nothing${answer?.finishReason ? ` (${answer.finishReason})` : ""}.`,
        step,
      );
    }
    this.truncated = answer?.finishReason === "MAX_TOKENS";
    if (this.truncated && !text) {
      throw new AIError(
        "Gemini ran out of output budget before emitting anything. The model's reasoning is " +
          "charged against the same budget, so this step needs a larger BUDGET entry.",
        step,
      );
    }

    return text;
  }

  private async send(
    step: string,
    prompt: string,
    generationConfig?: Record<string, unknown>,
  ): Promise<{ response: Response; requestId: number; startedAt: number }> {
    const model = this.modelFor(step);
    const url = `${ENDPOINT}/${encodeURIComponent(model)}:generateContent`;
    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(generationConfig ? { generationConfig } : {}),
    });

    for (let retriesUsed = 0; ; retriesUsed++) {
      const cooling = rateLimitRemainingMs();
      if (cooling > 0) {
        console.warn(
          `[AI] ${step} SKIPPED model=${model}: local rate-limit cooldown, ` +
            `${Math.ceil(cooling / 1000)}s left${rateLimitCooldownIsDaily() ? " (daily quota)" : ""}; no request sent`,
        );
        throw new AIRateLimitError(step, cooling, rateLimitCooldownIsDaily());
      }

      const requestId = ++requestCounter;
      const startedAt = Date.now();
      console.log(
        `[AI] #${requestId} ${step} START model=${model} attempt=${retriesUsed + 1} ` +
          `promptChars=${prompt.length}`,
      );

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          body,
        });
      } catch (error) {
        const cause = (error as { cause?: { code?: string; message?: string } }).cause;
        const name = (error as Error).name;
        const detail = cause?.code ?? cause?.message ?? (error as Error).message ?? "unknown";

        console.error(
          `[AI] #${requestId} ${step} FAILED ${name} ${detail} ${Date.now() - startedAt}ms`,
        );

        throw new AIError(
          name === "TimeoutError" || detail === "UND_ERR_HEADERS_TIMEOUT"
            ? `Gemini did not respond within ${REQUEST_TIMEOUT_MS / 1000}s on the "${step}" step. ` +
              `Long articles on thinking models are slow — try a shorter target length, or retry.`
            : `Could not reach the Gemini API (${detail}). Check the server's network access and that ` +
              `generativelanguage.googleapis.com is not blocked.`,
          step,
          error,
        );
      }

      if (response.ok) return { response, requestId, startedAt };

      const status = response.status;
      const info = parseGeminiError(await response.text().catch(() => ""));
      const hint = readRetryAfter(response.headers) ?? info.retryDelayMs;

      console.log(`[AI] #${requestId} ${step} END status=${status} ${Date.now() - startedAt}ms`);
      console.warn(
        `[gemini] #${requestId} ${step} model=${model} status=${status} ` +
          `error=${info.status || "-"} retry-after=${response.headers.get("retry-after") ?? "none"} ` +
          `retryDelay=${info.retryDelayMs ?? "none"}ms quota=${info.quotaIds.join(",") || "-"} ` +
          `message="${info.message}"`,
      );

      const daily = status === 429 && isDailyQuota(info.quotaIds);
      const decision = decideRetry({ status, retriesUsed, retryAfterMs: hint, dailyQuota: daily });

      if (decision.action === "wait") {
        console.warn(
          `[gemini] ${step}: ${decision.reason}; one retry after ${decision.waitMs}ms`,
        );
        await sleep(decision.waitMs);
        continue;
      }

      if (status === 429) {
        const cooldown = daily ? msUntilDailyReset() : (hint ?? DEFAULT_RATE_LIMIT_COOLDOWN_MS);
        startRateLimitCooldown(cooldown, Date.now(), daily);
        console.error(
          `[AI] rate limited on ${step} after ${retriesUsed + 1} attempt(s) (${decision.reason}); ` +
            `local cooldown ${Math.ceil(cooldown / 1000)}s${daily ? " until the daily reset (midnight Pacific)" : ""} ` +
            `— no Gemini requests until then`,
        );
        throw new AIRateLimitError(step, cooldown, daily);
      }

      if (status === 503) {
        console.error(`[AI] ${step} unavailable after ${retriesUsed + 1} attempt(s) (${decision.reason})`);
        throw new AIUnavailableError(
          "Gemini is busy right now (503) and was still unavailable after one retry. " +
            "This usually clears in a few minutes — try again shortly.",
          step,
          hint,
        );
      }

      const advice =
        status === 404
          ? ` The model "${model}" may have been retired — set GEMINI_MODEL to a current one.`
          : "";
      throw new AIError(
        `Gemini rejected the request (${status}${info.status ? ` ${info.status}` : ""}).${advice} ${info.message}`.trim(),
        step,
      );
    }
  }

  async suggestSeoLines(prompt: string): Promise<string[]> {
    const step = "seo-suggest";
    const { response, requestId, startedAt } = await this.send(step, prompt);

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const answer = data.candidates?.[0];
    const text = answer?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    console.log(
      `[AI] #${requestId} ${step} END status=200 finish=${answer?.finishReason ?? "?"} ` +
        `chars=${text.length} ${Date.now() - startedAt}ms`,
    );

    return text
      .split("\n")
      .map((line) => line.replace(/^\s*(?:[-*\d.)\s]+)?\s*/, "").replace(/^["']|["']$/g, "").trim())
      .filter(Boolean);
  }

  async analyseBlogs(items: CorpusItem[]): Promise<ContentProfile> {
    const shape = await this.call(
      "analyse",
      buildAnalysePrompt(items),
      PROFILE_SCHEMA,
      contentProfileSchema,
      BUDGET.analyse,
    );
    return withStats(shape, items);
  }

  async generateTopicCandidates(request: TopicRequest): Promise<TopicCandidate[]> {
    const { candidates } = await this.call(
      "topics",
      buildTopicResearchPrompt(request),
      TOPIC_SCHEMA,
      topicCandidatesSchema,
      BUDGET.topics,
    );
    return candidates;
  }

  generateBlogPlan(request: BlogRequest): Promise<BlogPlan> {
    return this.call(
      "plan",
      buildPlanningPrompt(request),
      PLAN_SCHEMA,
      planningSchema,
      BUDGET.plan,
      TEMPERATURE.prose,
    );
  }

  async generateCompleteBlog(request: BlogRequest, plan: BlogPlan | null): Promise<GeneratedBlog> {
    const blog = await this.call(
      "blog",
      buildBlogPrompt(request, plan),
      BLOG_SCHEMA,
      generatedBlogSchema,
      BUDGET.blog,
      TEMPERATURE.prose,
    );
    return { ...blog, category: blog.category || plan?.category || request.category };
  }

  async reviewCompleteBlog(
    body: string,
    profile: ContentProfile | null,
    references: { title: string; extract: string }[],
  ): Promise<CombinedReview> {
    const found = await this.call(
      "review",
      buildCombinedReviewPrompt(body, profile, references),
      REVIEW_SCHEMA,
      combinedReviewSchema,
      BUDGET.review,
    );

    const total =
      found.medical.length +
      found.originality.length +
      found.style.length +
      found.grammar.length +
      found.language.length;

    return { ...found, clean: total === 0 };
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function stripReferences(prompt: string): string {
  const start = prompt.indexOf("RELEVANT PREVIOUS ARTICLES");
  if (start === -1) return prompt;
  const next = prompt.indexOf("OUTPUT REQUIREMENTS", start);
  return next === -1 ? prompt.slice(0, start) : prompt.slice(0, start) + prompt.slice(next);
}
