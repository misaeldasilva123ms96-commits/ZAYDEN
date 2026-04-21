import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators } from "../../runtime/contracts/index.js";
import type { ProviderAdapter } from "../../runtime/providers/base/provider.interface.js";
import type { ProviderKind } from "../../runtime/providers/base/provider.types.js";
import { ProviderGateway, ProviderRegistry } from "../../runtime/providers/registry/provider-registry.js";
import type { ProviderRequest } from "../../runtime/contracts/index.js";

class MalformedAdapter implements ProviderAdapter {
  constructor(
    readonly id: string,
    readonly kind: ProviderKind,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(_request: ProviderRequest): Promise<unknown> {
    // Regression guard: provider gateways must reject malformed provider responses.
    return {
      contract_version: "1.0.0",
      correlation_id: "corr-malformed",
      // missing required fields from provider-response schema
      text: 123,
    };
  }
}

function req(): ProviderRequest {
  return {
    contract_version: "1.0.0",
    correlation_id: "corr-reg-malformed",
    session_id: "sess-reg-malformed",
    payload: {
      messages: [{ role: "user", content: "hello" }],
    },
    parameters: {},
  };
}

test("regression: malformed provider response is rejected by gateway", async () => {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new MalformedAdapter("bad-local", "local_gguf"));
  const gateway = new ProviderGateway(validators, registry);

  await assert.rejects(
    () => gateway.execute("bad-local", req()),
    /provider-response/i,
  );
});
