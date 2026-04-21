import assert from "node:assert/strict";
import test from "node:test";

import { loadHostConfigFromEnv } from "../../runtime/host/config/config-loader.js";
import { HostConfigError } from "../../runtime/host/config/env-schema.js";

test("config loader accepts valid environment", () => {
  const config = loadHostConfigFromEnv({
    HOST: "0.0.0.0",
    PORT: "9090",
    NODE_ENV: "development",
    LOG_LEVEL: "debug",
    ENABLE_API: "true",
    ENABLE_PERSISTENT_MEMORY: "true",
    MEMORY_FILE_PATH: ".tmp-memory",
    DEFAULT_ROUTING_PROFILE: "testing",
    LOCAL_PROVIDER_MODE: "mock",
    READINESS_STRICTNESS: "strict",
  });

  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.port, 9090);
  assert.equal(config.default_routing_profile, "testing");
  assert.equal(config.memory_file_path, ".tmp-memory");
});

test("config loader rejects invalid enum", () => {
  assert.throws(
    () =>
      loadHostConfigFromEnv({
        LOG_LEVEL: "loud",
      }),
    (error: unknown) =>
      error instanceof HostConfigError && error.code === "CONFIG_INVALID",
  );
});

test("config loader rejects missing required value when set empty", () => {
  assert.throws(
    () =>
      loadHostConfigFromEnv({
        PORT: "",
      }),
    (error: unknown) =>
      error instanceof HostConfigError && error.code === "CONFIG_MISSING",
  );
});

test("config loader applies defaults safely", () => {
  const config = loadHostConfigFromEnv({});
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 8787);
  assert.equal(config.enable_api, true);
  assert.equal(config.enable_persistent_memory, false);
  assert.equal(config.memory_file_path, null);
  assert.equal(config.local_provider_mode, "mock");
});
