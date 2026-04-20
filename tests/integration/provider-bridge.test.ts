import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { createContractValidators } from "../../runtime/contracts/index.js";
import { GemmaHttpAdapter } from "../../runtime/providers/adapters/local/gemma-http.adapter.js";
import { checkGemmaLocalHealth } from "../../runtime/providers/adapters/local/gemma-local.health.js";
import type { HttpTransport } from "../../runtime/providers/adapters/shared/http-client.js";
import {
  ProviderExecutionError,
  ProviderUnavailableError,
} from "../../runtime/providers/base/provider.errors.js";
import {
  ProviderGateway,
  ProviderRegistry,
} from "../../runtime/providers/registry/provider-registry.js";

function requestFixture() {
  return {
    contract_version: "1.0.0" as const,
    correlation_id: "corr-bridge-0001",
    session_id: "sess-bridge-1",
    payload: {
      messages: [{ role: "user" as const, content: "say hello" }],
    },
    parameters: {
      temperature: 0.1,
      max_output_tokens: 64,
    },
  };
}

test("bridge: real HTTP call success (when runtime available)", async (t) => {
  const health = await checkGemmaLocalHealth();
  if (!health.endpointReachable) {
    t.skip("local runtime endpoint not reachable");
    return;
  }
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(
    new GemmaHttpAdapter({
      id: "gemma-http-real",
      simulateWhenUnavailable: false,
    }),
  );
  const gateway = new ProviderGateway(validators, registry);
  const res = await gateway.execute("gemma-http-real", requestFixture());
  assert.equal(res.provider_actual.name, "gemma-http-real");
  assert.equal(res.raw_metadata?.simulated, false);
  assert.equal(typeof res.raw_metadata?.execution_time_ms, "number");
});

test("bridge: simulated fallback success when runtime unavailable", async () => {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(
    new GemmaHttpAdapter({
      id: "gemma-http-sim",
      endpoint: "http://127.0.0.1:1",
      simulateWhenUnavailable: true,
      simulateLatencyMs: 10,
    }),
  );
  const gateway = new ProviderGateway(validators, registry);
  const res = await gateway.execute("gemma-http-sim", requestFixture());
  assert.equal(res.raw_metadata?.simulated, true);
  assert.equal(typeof res.raw_metadata?.execution_time_ms, "number");
  assert.equal(typeof res.usage.provider_usage?.execution_time_ms, "number");
  assert.ok(String(res.raw_metadata?.failure_reason ?? "").length > 0);
});

test("bridge: provider unavailable is handled", async () => {
  delete process.env.ZAYDEN_GGUF_ZIP_PATH;
  delete process.env.ZAYDEN_GGUF_PATH;
  delete process.env.ZAYDEN_GEMMA_CLI_CMD;
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(
    new GemmaHttpAdapter({
      id: "gemma-http-required",
      endpoint: "http://127.0.0.1:1",
      simulateWhenUnavailable: false,
    }),
  );
  const gateway = new ProviderGateway(validators, registry);
  await assert.rejects(
    () => gateway.execute("gemma-http-required", requestFixture()),
    ProviderUnavailableError,
  );
});

test("bridge: malformed external response is rejected as provider error envelope", async () => {
  const server = createServer((_req, res) => {
    res.statusCode = 200;
    res.end("ok");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  if (!addr || typeof addr === "string") {
    server.close();
    throw new Error("Unable to bind test server");
  }
  const endpoint = `http://127.0.0.1:${addr.port}`;

  const malformedTransport: HttpTransport = {
    async postJson() {
      return {
        ok: true,
        status: 200,
        headers: {},
        bodyText: "{\"unexpected\":true}",
        json: { unexpected: true },
      };
    },
  };
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(
    new GemmaHttpAdapter({
      id: "gemma-http-malformed",
      endpoint,
      simulateWhenUnavailable: false,
      transport: malformedTransport,
    }),
  );
  const gateway = new ProviderGateway(validators, registry);
  try {
    await assert.rejects(async () => {
      await gateway.execute("gemma-http-malformed", requestFixture());
    }, (error: unknown) => {
      assert.ok(error instanceof ProviderExecutionError);
      assert.equal(error.envelope.error_type, "PROVIDER_EXECUTION_ERROR");
      assert.equal(error.envelope.origin, "provider");
      assert.equal(typeof error.envelope.metadata.execution_time_ms, "number");
      return true;
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("bridge: latency metadata is always present", async () => {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(
    new GemmaHttpAdapter({
      id: "gemma-http-latency",
      endpoint: "http://127.0.0.1:1",
      simulateWhenUnavailable: true,
      simulateLatencyMs: 5,
    }),
  );
  const gateway = new ProviderGateway(validators, registry);
  const res = await gateway.execute("gemma-http-latency", requestFixture());
  assert.equal(typeof res.raw_metadata?.execution_time_ms, "number");
  assert.equal(typeof res.usage.provider_usage?.execution_time_ms, "number");
});
