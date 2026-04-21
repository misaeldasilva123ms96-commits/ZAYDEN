import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import { createContractValidators } from "../../runtime/contracts/index.js";
import { RuntimeOrchestrator } from "../../runtime/core/runtime-orchestrator.js";
import { RuntimeService } from "../../runtime/core/runtime-service.js";
import { ProviderGateway, ProviderRegistry } from "../../runtime/providers/registry/provider-registry.js";
import { createApiHttpServer, listenApiServer } from "../../runtime/api/transport/http-server.js";
import type { ProviderAdapter } from "../../runtime/providers/base/provider.interface.js";
import type { ProviderKind } from "../../runtime/providers/base/provider.types.js";
import type { ProviderRequest, ProviderResponse } from "../../runtime/contracts/index.js";
import { httpPostJson } from "./_http.js";

class LocalOk implements ProviderAdapter {
  constructor(
    readonly id: string,
    readonly kind: ProviderKind,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    const last = request.payload.messages.at(-1)?.content ?? "";
    return {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: { kind: this.kind, name: this.id, model: this.id },
      model: this.id,
      text: `echo:${last}`,
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    };
  }
}

function makeService() {
  const v = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new LocalOk("local-a", "local_gguf"));
  const gateway = new ProviderGateway(v, registry);
  const orchestrator = new RuntimeOrchestrator(v, gateway, registry);
  return new RuntimeService({ orchestrator, registry });
}

test("POST /api/chat valid request returns success with request_id", async () => {
  const runtimeService = makeService();
  const server = createApiHttpServer({ runtimeService });
  await listenApiServer(server, 0);
  const { port } = server.address() as AddressInfo;
  const r = await httpPostJson("127.0.0.1", port, "/api/chat", {
    api_version: "1.0.0",
    session_id: "sess-api-1",
    input: "hello",
    mode: "LOCAL_ONLY",
    routing_policy: { preferred_local_provider: "local-a", strict_local_only: true },
    tool_policy: { contract_version: "1.0.0", allow_tools: false, allowed_tool_names: [] },
    memory_policy: { enable_session_state: false, enable_persistent_memory: false },
  });
  assert.equal(r.status, 200);
  const body = JSON.parse(r.body) as {
    request_id?: string;
    status?: string;
    output?: string;
    response_source?: string;
  };
  assert.equal(body.status, "success");
  assert.ok(body.request_id);
  assert.equal(body.response_source, "runtime");
  assert.ok(body.output?.includes("hello"));
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("POST /api/chat invalid schema returns 400", async () => {
  const runtimeService = makeService();
  const server = createApiHttpServer({ runtimeService });
  await listenApiServer(server, 0);
  const { port } = server.address() as AddressInfo;
  const r = await httpPostJson("127.0.0.1", port, "/api/chat", { api_version: "1.0.0" });
  assert.equal(r.status, 400);
  const body = JSON.parse(r.body) as { error_code?: string; request_id?: string };
  assert.equal(body.error_code, "INVALID_REQUEST");
  assert.ok(body.request_id);
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("POST /api/chat maps normalized runtime errors to public-safe envelope", async () => {
  const v = createContractValidators();
  const registry = new ProviderRegistry();
  const gateway = new ProviderGateway(v, registry);
  const orchestrator = new RuntimeOrchestrator(v, gateway, registry);
  const runtimeService = new RuntimeService({ orchestrator, registry });
  const server = createApiHttpServer({ runtimeService });
  await listenApiServer(server, 0);
  const { port } = server.address() as AddressInfo;
  const r = await httpPostJson("127.0.0.1", port, "/api/chat", {
    api_version: "1.0.0",
    session_id: "sess-err-1",
    input: "hello",
    mode: "LOCAL_ONLY",
    routing_policy: { preferred_local_provider: "missing", strict_local_only: true },
    tool_policy: { contract_version: "1.0.0", allow_tools: false, allowed_tool_names: [] },
    memory_policy: { enable_session_state: false, enable_persistent_memory: false },
  });
  assert.ok(r.status === 503 || r.status === 409 || r.status === 500);
  const body = JSON.parse(r.body) as {
    error_code?: string;
    request_id?: string;
    message?: string;
    stack?: string;
  };
  assert.ok(body.request_id);
  assert.ok(body.error_code);
  assert.equal(body.stack, undefined);
  assert.ok(!body.message?.includes("at "));
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
