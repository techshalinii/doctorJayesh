import "server-only";

import { BAZAARLINK, OpenAICompatibleProvider } from "./openai-compatible";

export class BazaarLinkProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model?: string, topicsModel?: string) {
    super(BAZAARLINK, apiKey, model, topicsModel);
  }
}
