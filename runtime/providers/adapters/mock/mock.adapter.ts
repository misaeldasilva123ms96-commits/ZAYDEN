import type { ProviderAdapter } from "../../base/provider.interface.js";
import type { ProviderRequest, ProviderResponse } from "../../base/provider.types.js";

/**
 * Deterministic mock for tests and dry-runs. Always available.
 */
export class MockProviderAdapter implements ProviderAdapter {
  readonly id: string;
  readonly kind = "unknown" as const;

  constructor(id = "mock") {
    this.id = id;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    const lastUser = [...request.payload.messages]
      .reverse()
      .find((m) => m.role === "user")?.content;

    const response: ProviderResponse = {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: { kind: "unknown", name: this.id, model: "mock" },
      model: "mock",
      text: `mock:${lastUser ?? ""}`,
      finish_reason: "stop",
      usage: {
        contract_version: "1.0.0",
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
      },
    };
    return response;
  }
}
