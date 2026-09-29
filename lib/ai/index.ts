import "server-only";

import { BazaarLinkProvider } from "./bazaarlink";
import { GeminiProvider } from "./gemini";
import { MockAIProvider } from "./mock";
import { SarvamProvider } from "./sarvam";
import { AIError } from "./types";
import type { AIProvider } from "./types";

export function getAIProvider(): AIProvider {
  const configured = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const bazaarlinkKey = (process.env.BAZAARLINK_API_KEY ?? "").trim();
  const sarvamKey = (process.env.SARVAM_API_KEY ?? "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY ?? "").trim();

  if (configured === "mock") return new MockAIProvider();

  if (configured === "bazaarlink") {
    if (!bazaarlinkKey) throw new AIError("AI_PROVIDER=bazaarlink but BAZAARLINK_API_KEY is not set.", "config");
    return new BazaarLinkProvider(bazaarlinkKey);
  }

  if (configured === "sarvam") {
    if (!sarvamKey) throw new AIError("AI_PROVIDER=sarvam but SARVAM_API_KEY is not set.", "config");
    return new SarvamProvider(sarvamKey);
  }

  if (configured === "gemini") {
    if (!geminiKey) throw new AIError("AI_PROVIDER=gemini but GEMINI_API_KEY is not set.", "config");
    return new GeminiProvider(geminiKey);
  }

  if (configured) {
    throw new AIError(
      `Unknown AI_PROVIDER "${configured}". Use "bazaarlink", "sarvam", "gemini" or "mock".`,
      "config",
    );
  }

  if (bazaarlinkKey) return new BazaarLinkProvider(bazaarlinkKey);
  if (sarvamKey) return new SarvamProvider(sarvamKey);
  if (geminiKey) return new GeminiProvider(geminiKey);
  return new MockAIProvider();
}

const LABELS: Record<string, string> = { bazaarlink: "BazaarLink", sarvam: "Sarvam", gemini: "Gemini" };

export function providerLabel(provider: string): string {
  return LABELS[provider] ?? "The AI provider";
}

export function describeProvider(): { provider: string; model: string; live: boolean } {
  const provider = getAIProvider();
  return { ...provider.info, live: provider.info.provider !== "mock" };
}

export { AIError, AIRateLimitError, AIUnavailableError, aiErrorResponse } from "./types";
export type * from "./types";
