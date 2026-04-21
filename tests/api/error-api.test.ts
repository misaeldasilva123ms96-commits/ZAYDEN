import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import { createContractValidators } from "../../runtime/contracts/index.js";
import { RuntimeOrchestrator } from "../../runtime/core/runtime-orchestrator.js";
import { RuntimeService } from "../../runtime/core/runtime-service.js";
import { ProviderGateway, ProviderRegistry } from "../../runtime/providers/registry/provider-registry.js";
import { createApiHttpServer, listenApiServer } from "../../runtime/api/transport/http-server.js";
import { httpGet } from "./_http.js";

test("unknown route returns 404 with request_id", async () => {
  const v = createContractValidators();
  const registry = new ProviderRegistry();
  const gateway = new ProviderGateway(v, registry);
  const orchestrator = new RuntimeOrchestrator(v, gateway, registry);
  const runtimeService = new RuntimeService({ orchestrator, registry });
  const server = createApiHttpServer({ runtimeService });
  await listenApiServer(server, 0);
  const { port } = server.address() as AddressInfo;
  const r = await httpGet("127.0.0.1", port, "/api/missing");
  assert.equal(r.status, 404);
  const body = JSON.parse(r.body) as { error_code?: string; request_id?: string };
  assert.equal(body.error_code, "NOT_FOUND");
  assert.ok(body.request_id);
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
