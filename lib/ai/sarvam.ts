import "server-only";

import { OpenAICompatibleProvider, SARVAM } from "./openai-compatible";

export class SarvamProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model?: string, topicsModel?: string) {
    super(SARVAM, apiKey, model, topicsModel);
  }
}
