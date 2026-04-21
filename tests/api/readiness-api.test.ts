import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import { createContractValidators } from "../../runtime/contracts/index.js";
import { RuntimeOrchestrator } from "../../runtime/core/runtime-orchestrator.js";
import { RuntimeService } from "../../runtime/core/runtime-service.js";
import { ProviderGateway, ProviderRegistry } from "../../runtime/providers/registry/provider-registry.js";
import { createApiHttpServer, listenApiServer } from "../../runtime/api/transport/http-server.js";
import { httpGet } from "./_http.js";
import type { ProviderAdapter } from "../../runtime/providers/base/provider.interface.js";
import type { ProviderKind } from "../../runtime/providers/base/provider.types.js";
import type { ProviderRequest, ProviderResponse } from "../../runtime/contracts/index.js";

class StubAdapter implements ProviderAdapter {
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
      text: "stub",
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }
}

test("GET /api/readiness returns 503 when no adapters registered", async () => {
  const v = createContractValidators();
  const registry = new ProviderRegistry();
  const gateway = new ProviderGateway(v, registry);
  const orchestrator = new RuntimeOrchestrator(v, gateway, registry);
  const runtimeService = new RuntimeService({ orchestrator, registry });
  const server = createApiHttpServer({ runtimeService });
  await listenApiServer(server, 0);
  const { port } = server.address() as AddressInfo;
  const r = await httpGet("127.0.0.1", port, "/api/readiness");
  assert.equal(r.status, 503);
  const body = JSON.parse(r.body) as { ready?: boolean; request_id?: string };
  assert.equal(body.ready, false);
  assert.ok(body.request_id);
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("GET /api/readiness returns 200 when adapters exist", async () => {
  const v = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new StubAdapter("x", "local_gguf"));
  const gateway = new ProviderGateway(v, registry);
  const orchestrator = new RuntimeOrchestrator(v, gateway, registry);
  const runtimeService = new RuntimeService({ orchestrator, registry });
  const server = createApiHttpServer({ runtimeService });
  await listenApiServer(server, 0);
  const { port } = server.address() as AddressInfo;
  const r = await httpGet("127.0.0.1", port, "/api/readiness");
  assert.equal(r.status, 200);
  const body = JSON.parse(r.body) as { ready?: boolean; request_id?: string };
  assert.equal(body.ready, true);
  assert.ok(body.request_id);
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
