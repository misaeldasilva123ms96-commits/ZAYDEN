import type { ProviderAdapter } from "../../base/provider.interface.js";
import type { ProviderRequest, ProviderResponse } from "../../base/provider.types.js";
import { GemmaHttpAdapter } from "./gemma-http.adapter.js";

/**
 * Compatibility adapter preserving `gemma-local` id while delegating to HTTP bridge.
 * Simulated fallback is disabled here; gateway should surface unavailable state.
 */
export class GemmaLocalAdapter implements ProviderAdapter {
  readonly id = "gemma-local" as const;
  readonly kind = "local_gguf" as const;
  private readonly delegate = new GemmaHttpAdapter({
    id: this.id,
    simulateWhenUnavailable: false,
  });

  async isAvailable(): Promise<boolean> {
    return this.delegate.isAvailable();
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    return this.delegate.execute(request);
  }
}
