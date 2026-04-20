import type { ProviderAdapter } from "../../base/provider.interface.js";
import type { ProviderRequest, ProviderResponse } from "../../base/provider.types.js";
import { checkGemmaLocalHealth } from "./gemma-local.health.js";

/**
 * Local GGUF placeholder adapter: validates env layout, returns deterministic stub text.
 * Real inference belongs in a future subprocess/service boundary — not here.
 */
export class GemmaLocalAdapter implements ProviderAdapter {
  readonly id = "gemma-local" as const;
  readonly kind = "local_gguf" as const;

  async isAvailable(): Promise<boolean> {
    const h = await checkGemmaLocalHealth();
    return h.ok;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    const model =
      process.env.ZAYDEN_LOCAL_MODEL_NAME ?? "gemma-2-2b-it-f32";
    const lastUser = [...request.payload.messages]
      .reverse()
      .find((m) => m.role === "user")?.content;

    const text =
      `[zayden:gemma-local stub] model=${model} echo=` +
      JSON.stringify(lastUser ?? "");

    const response: ProviderResponse = {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: {
        kind: "local_gguf",
        name: this.id,
        model,
      },
      model,
      text,
      finish_reason: "stop",
      usage: {
        contract_version: "1.0.0",
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        provider_usage: { stub: true },
      },
      raw_metadata: { adapter: this.id, note: "no inference executed" },
    };
    return response;
  }
}
