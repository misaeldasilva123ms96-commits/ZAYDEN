import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators } from "../../runtime/contracts/index.js";
import { RuntimeOrchestrator } from "../../runtime/core/runtime-orchestrator.js";
import { RuntimeService } from "../../runtime/core/runtime-service.js";
import { ProviderGateway, ProviderRegistry } from "../../runtime/providers/registry/provider-registry.js";
import { parseAndNormalizeChatRequest } from "../../runtime/api/normalization/request-normalizer.js";
import type { ProviderAdapter } from "../../runtime/providers/base/provider.interface.js";
import type { ProviderKind } from "../../runtime/providers/base/provider.types.js";
import type { ProviderRequest, ProviderResponse } from "../../runtime/contracts/index.js";

class SvcAdapter implements ProviderAdapter {
  constructor(
    readonly id: string,
    readonly kind: ProviderKind,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    return {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: { kind: this.kind, name: this.id, model: this.id },
      model: this.id,
      text: "svc-ok",
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }
}

test("runtime-service maps normalized public input to public response envelope", async () => {
  const v = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new SvcAdapter("local-a", "local_gguf"));
  const gateway = new ProviderGateway(v, registry);
  const orchestrator = new RuntimeOrchestrator(v, gateway, registry);
  const svc = new RuntimeService({ orchestrator, registry });
  const normalized = parseAndNormalizeChatRequest({
    api_version: "1.0.0",
    session_id: "s-svc",
    input: "ping",
    mode: "LOCAL_ONLY",
    routing_policy: { preferred_local_provider: "local-a", strict_local_only: true },
    tool_policy: { contract_version: "1.0.0", allow_tools: false, allowed_tool_names: [] },
    memory_policy: { enable_session_state: false, enable_persistent_memory: false },
  });
  const out = await svc.executeChat({ request_id: "req-svc-1", normalized });
  assert.equal(out.kind, "success");
  if (out.kind === "success") {
    assert.equal(out.public_response.status, "success");
    assert.equal(out.public_response.request_id, "req-svc-1");
    assert.equal(out.public_response.response_source, "runtime");
  }
});
