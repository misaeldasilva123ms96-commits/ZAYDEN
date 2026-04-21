import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import { bootstrapRuntimeHost } from "../../runtime/host/bootstrap/runtime-bootstrap.js";
import { HostConfigError } from "../../runtime/host/config/env-schema.js";
import { httpGet, httpPostJson } from "../api/_http.js";

test("service host boots and serves health endpoint", async () => {
  const boot = await bootstrapRuntimeHost({
    env: {
      ENABLE_API: "true",
      PORT: "0",
      HOST: "127.0.0.1",
      LOCAL_PROVIDER_MODE: "mock",
      NODE_ENV: "test",
      LOG_LEVEL: "error",
    },
  });
  try {
    const { port } = boot.server?.address() as AddressInfo;
    const health = await httpGet("127.0.0.1", port, "/api/health");
    assert.equal(health.status, 200);
  } finally {
    await boot.stop();
  }
});

test("invalid host config prevents boot", async () => {
  await assert.rejects(
    () =>
      bootstrapRuntimeHost({
        env: {
          PORT: "not-a-port",
        },
      }),
    (error: unknown) =>
      error instanceof HostConfigError && error.code === "CONFIG_INVALID",
  );
});

test("request passes host to api to runtime-service", async () => {
  const boot = await bootstrapRuntimeHost({
    env: {
      ENABLE_API: "true",
      PORT: "0",
      HOST: "127.0.0.1",
      LOCAL_PROVIDER_MODE: "mock",
      NODE_ENV: "test",
      LOG_LEVEL: "error",
    },
  });
  try {
    const { port } = boot.server?.address() as AddressInfo;
    const chat = await httpPostJson("127.0.0.1", port, "/api/chat", {
      api_version: "1.0.0",
      session_id: "host-it-1",
      input: "hello through host",
    mode: "HYBRID",
      routing_policy: {
        preferred_local_provider: "mock-local",
      allow_fallback: true,
      },
      tool_policy: {
        contract_version: "1.0.0",
        allow_tools: false,
        allowed_tool_names: [],
      },
      memory_policy: {
        enable_session_state: false,
        enable_persistent_memory: false,
      },
    });
    assert.equal(chat.status, 200);
    const body = JSON.parse(chat.body) as { status?: string; request_id?: string };
    assert.equal(body.status, "success");
    assert.ok(body.request_id);
  } finally {
    await boot.stop();
  }
});
