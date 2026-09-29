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
import { rateLimitRemainingMs, startRateLimitCooldown } from "./cooldown";
import { decideRetry, DEFAULT_RATE_LIMIT_COOLDOWN_MS, readRetryAfter } from "./retry-policy";
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

export interface CompatibleConfig {
  id: string;
  label: string;
  envPrefix: string;
  endpoint: string;
  host: string;
  defaultModel: string;
  defaultMaxTokens: number;
  authHeaders: (apiKey: string) => Record<string, string>;
  reasoningOff: null | "none";
}

const REQUEST_TIMEOUT_MS = 120_000;

const MAX_ATTEMPTS = 2;

const TEMPERATURE = { prose: 0.95, structured: 0.4 } as const;

const BUDGET = {
  analyse: 32768,
  topics: 16384,
  plan: 16384,
  blog: 32768,
  review: 16384,
  seo: 2048,
} as const;

const REASONING_EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number] | "none" | null;

const CREDIT_CODES = new Set(["insufficient_quota_error", "insufficient_quota", "insufficient_credits"]);
const AUTH_CODES = new Set(["invalid_api_key_error", "authentication_error", "invalid_api_key"]);

let requestCounter = 0;

interface CompatibleError {
  code: string;
  message: string;
}

function parseError(body: string): CompatibleError {
  try {
    const error = (JSON.parse(body) as { error?: { code?: unknown; type?: unknown; message?: unknown } }).error;
    const code = error?.code ?? error?.type;
    return {
      code: typeof code === "string" || typeof code === "number" ? String(code) : "",
      message: typeof error?.message === "string" ? error.message.slice(0, 300) : "",
    };
  } catch {
    return { code: "", message: body.slice(0, 300) };
  }
}

function requireAll(schema: ResponseSchema): ResponseSchema {
  if (schema.type === "array" && schema.items) {
    return { ...schema, items: requireAll(schema.items as ResponseSchema) };
  }
  if (schema.type === "object" && schema.properties) {
    const properties = Object.fromEntries(
      Object.entries(schema.properties as Record<string, ResponseSchema>).map(([k, v]) => [k, requireAll(v)]),
    );
    return { ...schema, properties, required: Object.keys(properties) };
  }
  return schema;
}

function readMaxTokens(raw: string | undefined, fallback: number): number {
  const value = Number(raw?.trim());
  return Number.isFinite(value) && value >= 256 ? Math.round(value) : fallback;
}

function readReasoningEffort(raw: string | undefined, off: null | "none"): ReasoningEffort {
  const value = raw?.trim().toLowerCase() ?? "";
  if (value === "none" || value === "off") return off;
  return (REASONING_EFFORTS as readonly string[]).includes(value) ? (value as ReasoningEffort) : "low";
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly info: ProviderInfo;
  private readonly config: CompatibleConfig;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly topicsModel: string;
  private readonly maxTokens: number;
  private readonly reasoningEffort: ReasoningEffort;
  private truncated = false;

  constructor(config: CompatibleConfig, apiKey: string, model?: string, topicsModel?: string) {
    const env = (name: string) => process.env[`${config.envPrefix}_${name}`]?.trim();
    if (!apiKey) throw new AIError(`${config.envPrefix}_API_KEY is not set.`, "config");
    this.config = config;
    this.apiKey = apiKey;

    this.model = model?.trim() || env("MODEL") || config.defaultModel;
    this.topicsModel = topicsModel?.trim() || env("TOPICS_MODEL") || this.model;
    this.maxTokens = readMaxTokens(env("MAX_TOKENS"), config.defaultMaxTokens);
    this.reasoningEffort = readReasoningEffort(env("REASONING_EFFORT"), config.reasoningOff);
    this.info = { provider: config.id, model: this.model, topicsModel: this.topicsModel };
  }

  private modelFor(step: string): string {
    return step === "topics" ? this.topicsModel : this.model;
  }

  private budget(tokens: number): number {
    return Math.min(tokens, this.maxTokens);
  }

  private async call<T>(
    step: string,
    prompt: string,
    schema: ResponseSchema,
    validator: z.ZodType<T>,
    maxTokens: number,
    temperature: number = TEMPERATURE.structured,
  ): Promise<T> {
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const text = attempt === 1 ? prompt : `${prompt}\n\nYour previous reply was rejected: ${lastError}\nReturn valid JSON matching the schema exactly.`;

      let raw: string;
      try {
        raw = await this.fetchJson(step, text, schema, this.budget(maxTokens), temperature);
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
        ? `${this.config.label} ran out of output tokens mid-answer, so the reply was incomplete (${lastError}). ` +
          `Raise ${this.config.envPrefix}_MAX_TOKENS (your plan's output limit permitting) or lower ` +
          `${this.config.envPrefix}_REASONING_EFFORT.`
        : `The model's reply did not match the expected shape after ${MAX_ATTEMPTS} attempts (${lastError}).`,
      step,
    );
  }

  private async fetchJson(
    step: string,
    prompt: string,
    schema: ResponseSchema,
    maxTokens: number,
    temperature: number,
  ): Promise<string> {
    const shape = requireAll(schema);
    const withShape =
      `${prompt}\n\nReturn only a JSON object that matches this JSON Schema exactly. Use these exact ` +
      `field names, include every required field, and use only the listed enum values:\n${JSON.stringify(shape)}`;

    const { data, requestId, startedAt } = await this.send(step, withShape, {
      temperature,
      max_tokens: maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: { name: step.replace(/[^A-Za-z0-9_-]/g, "_"), schema: shape },
      },
    });

    const choice = data.choices?.[0];
    const text = choice?.message?.content ?? "";
    const finish = choice?.finish_reason ?? "?";

    console.log(
      `[AI] #${requestId} ${step} END status=200 finish=${finish} chars=${text.length} ` +
        `tokens=${data.usage?.total_tokens ?? "?"} ${Date.now() - startedAt}ms`,
    );

    this.truncated = finish === "length";

    if (!text) {
      throw new AIError(
        this.truncated
          ? `${this.config.label} spent its whole output budget reasoning and returned no answer. Raise ` +
            `${this.config.envPrefix}_MAX_TOKENS (your plan's output limit permitting) or lower ` +
            `${this.config.envPrefix}_REASONING_EFFORT.`
          : `${this.config.label} returned nothing${finish !== "?" ? ` (${finish})` : ""}.`,
        step,
      );
    }

    return text;
  }

  private async send(
    step: string,
    prompt: string,
    options: Record<string, unknown>,
  ): Promise<{ data: CompletionResponse; requestId: number; startedAt: number }> {
    const model = this.modelFor(step);
    const body = JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      reasoning_effort: this.reasoningEffort,
      ...options,
    });

    for (let retriesUsed = 0; ; retriesUsed++) {
      const cooling = rateLimitRemainingMs();
      if (cooling > 0) {
        console.warn(
          `[AI] ${step} SKIPPED model=${model}: local rate-limit cooldown, ` +
            `${Math.ceil(cooling / 1000)}s left; no request sent`,
        );
        throw new AIRateLimitError(step, cooling, false, this.config.label);
      }

      const requestId = ++requestCounter;
      const startedAt = Date.now();
      console.log(
        `[AI] #${requestId} ${step} START model=${model} attempt=${retriesUsed + 1} ` +
          `promptChars=${prompt.length}`,
      );

      let response: Response;
      try {
        response = await fetch(this.config.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json", ...this.config.authHeaders(this.apiKey) },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          body,
        });
      } catch (error) {
        const cause = (error as { cause?: { code?: string; message?: string } }).cause;
        const name = (error as Error).name;
        const detail = cause?.code ?? cause?.message ?? (error as Error).message ?? "unknown";

        console.error(`[AI] #${requestId} ${step} FAILED ${name} ${detail} ${Date.now() - startedAt}ms`);

        throw new AIError(
          name === "TimeoutError" || detail === "UND_ERR_HEADERS_TIMEOUT"
            ? `${this.config.label} did not respond within ${REQUEST_TIMEOUT_MS / 1000}s on the "${step}" step. ` +
              `Try a shorter target length, a lower ${this.config.envPrefix}_REASONING_EFFORT, or retry.`
            : `Could not reach the ${this.config.label} API (${detail}). Check the server's network access ` +
              `and that ${this.config.host} is not blocked.`,
          step,
          error,
        );
      }

      if (response.ok) {
        return { data: (await response.json()) as CompletionResponse, requestId, startedAt };
      }

      const status = response.status;
      const info = parseError(await response.text().catch(() => ""));
      const hint = readRetryAfter(response.headers);

      console.log(`[AI] #${requestId} ${step} END status=${status} ${Date.now() - startedAt}ms`);
      console.warn(
        `[${this.config.id}] #${requestId} ${step} model=${model} status=${status} code=${info.code || "-"} ` +
          `retry-after=${response.headers.get("retry-after") ?? "none"} message="${info.message}"`,
      );

      if (status === 402 || CREDIT_CODES.has(info.code)) {
        throw new AIError(
          `${this.config.label} reports the account's credits or quota are used up. Top up or upgrade ` +
            `the plan in the ${this.config.label} dashboard, then try again.`,
          step,
        );
      }

      if (status === 401 || status === 403 || AUTH_CODES.has(info.code)) {
        throw new AIError(
          `${this.config.label} rejected the API key. Check ${this.config.envPrefix}_API_KEY in .env.`,
          step,
        );
      }

      const decision = decideRetry({ status, retriesUsed, retryAfterMs: hint });

      if (decision.action === "wait") {
        console.warn(`[${this.config.id}] ${step}: ${decision.reason}; one retry after ${decision.waitMs}ms`);
        await sleep(decision.waitMs);
        continue;
      }

      if (status === 429) {
        const cooldown = hint ?? DEFAULT_RATE_LIMIT_COOLDOWN_MS;
        startRateLimitCooldown(cooldown);
        console.error(
          `[AI] rate limited on ${step} after ${retriesUsed + 1} attempt(s) (${decision.reason}); ` +
            `local cooldown ${Math.ceil(cooldown / 1000)}s — no requests until then`,
        );
        throw new AIRateLimitError(step, cooldown, false, this.config.label);
      }

      if (status === 503) {
        console.error(`[AI] ${step} unavailable after ${retriesUsed + 1} attempt(s) (${decision.reason})`);
        throw new AIUnavailableError(
          `${this.config.label} is busy right now (503) and was still unavailable after one retry. ` +
            "This usually clears in a few minutes — try again shortly.",
          step,
          hint,
        );
      }

      const advice =
        status === 404 || info.code === "not_found_error"
          ? ` The model "${model}" may not exist — check ${this.config.envPrefix}_MODEL.`
          : "";
      throw new AIError(
        `${this.config.label} rejected the request (${status}${info.code ? ` ${info.code}` : ""}).${advice} ${info.message}`.trim(),
        step,
      );
    }
  }

  async suggestSeoLines(prompt: string): Promise<string[]> {
    const step = "seo-suggest";
    const { data, requestId, startedAt } = await this.send(step, prompt, {
      max_tokens: this.budget(BUDGET.seo),
    });

    const choice = data.choices?.[0];
    const text = choice?.message?.content ?? "";

    console.log(
      `[AI] #${requestId} ${step} END status=200 finish=${choice?.finish_reason ?? "?"} ` +
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

interface CompletionResponse {
  choices?: {
    finish_reason?: string;
    message?: { content?: string | null; reasoning_content?: string };
  }[];
  usage?: { total_tokens?: number };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const SARVAM: CompatibleConfig = {
  id: "sarvam",
  label: "Sarvam",
  envPrefix: "SARVAM",
  endpoint: "https://api.sarvam.ai/v1/chat/completions",
  host: "api.sarvam.ai",
  defaultModel: "sarvam-105b",
  defaultMaxTokens: 4096,
  authHeaders: (apiKey) => ({ "api-subscription-key": apiKey }),
  reasoningOff: null,
};

export const BAZAARLINK: CompatibleConfig = {
  id: "bazaarlink",
  label: "BazaarLink",
  envPrefix: "BAZAARLINK",
  endpoint: "https://api.bazaarlink.ai/v1/chat/completions",
  host: "api.bazaarlink.ai",
  defaultModel: "gpt-6-luna",
  defaultMaxTokens: 16384,
  authHeaders: (apiKey) => ({ authorization: `Bearer ${apiKey}` }),
  reasoningOff: "none",
};
