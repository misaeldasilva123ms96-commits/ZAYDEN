import assert from "node:assert/strict";
import test from "node:test";

import { createDependencyContainer } from "../../runtime/host/bootstrap/dependency-container.js";
import { bootstrapRuntimeHost } from "../../runtime/host/bootstrap/runtime-bootstrap.js";
import type { HostConfig } from "../../runtime/host/config/env-schema.js";

function baseConfig(overrides: Partial<HostConfig> = {}): HostConfig {
  return {
    host: "127.0.0.1",
    port: 0,
    node_env: "test",
    log_level: "info",
    enable_api: false,
    enable_persistent_memory: false,
    memory_file_path: null,
    default_routing_profile: "testing",
    local_provider_mode: "mock",
    readiness_strictness: "lenient",
    ...overrides,
  };
}

test("dependency container wires runtime-service and dependencies", () => {
  const container = createDependencyContainer(baseConfig());
  assert.ok(container.runtime_service);
  assert.ok(container.runtime_orchestrator);
  assert.ok(container.tool_orchestrator);
  assert.equal(container.api_server, null);
});

test("bootstrap creates API server when enabled", async () => {
  const boot = await bootstrapRuntimeHost({
    config: baseConfig({ enable_api: true }),
  });
  assert.ok(boot.server);
  await boot.stop();
});

test("persistent memory store is enabled only when configured", () => {
  const disabled = createDependencyContainer(baseConfig({ enable_persistent_memory: false }));
  assert.equal(disabled.memory_store, null);

  const enabled = createDependencyContainer(
    baseConfig({
      enable_persistent_memory: true,
      memory_file_path: ".tmp-host-memory",
    }),
  );
  assert.ok(enabled.memory_store);
});
