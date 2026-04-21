import assert from "node:assert/strict";
import test from "node:test";

import { loadHostConfigFromEnv } from "../../runtime/host/config/config-loader.js";
import { HostConfigError } from "../../runtime/host/config/env-schema.js";

test("regression: empty HOST is rejected as CONFIG_MISSING", () => {
  assert.throws(
    () =>
      loadHostConfigFromEnv({
        HOST: "",
      }),
    (error: unknown) =>
      error instanceof HostConfigError && error.code === "CONFIG_MISSING",
  );
});

test("regression: MEMORY_FILE_PATH without persistent memory is CONFIG_CONFLICT", () => {
  assert.throws(
    () =>
      loadHostConfigFromEnv({
        ENABLE_PERSISTENT_MEMORY: "false",
        MEMORY_FILE_PATH: ".zayden-memory",
      }),
    (error: unknown) =>
      error instanceof HostConfigError && error.code === "CONFIG_CONFLICT",
  );
});
