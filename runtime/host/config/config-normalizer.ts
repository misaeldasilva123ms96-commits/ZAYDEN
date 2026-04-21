import type { EnvironmentProfile } from "../../providers/routing/routing-types.js";
import {
  HostConfigError,
  type HostConfig,
  type HostLogLevel,
  type HostNodeEnv,
  type LocalProviderMode,
  type ReadinessStrictness,
} from "./env-schema.js";

type EnvLike = Record<string, string | undefined>;

const NODE_ENVS: readonly HostNodeEnv[] = ["development", "test", "production"];
const LOG_LEVELS: readonly HostLogLevel[] = ["debug", "info", "warn", "error"];
const LOCAL_PROVIDER_MODES: readonly LocalProviderMode[] = [
  "mock",
  "gemma-local",
  "gemma-http",
  "gemma-cli",
];
const READINESS_STRICTNESS: readonly ReadinessStrictness[] = ["lenient", "strict"];
const ROUTING_PROFILES: readonly EnvironmentProfile[] = [
  "development",
  "testing",
  "production",
];

function readTrimmed(env: EnvLike, key: string): string | undefined {
  const raw = env[key];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new HostConfigError("CONFIG_MISSING", `${key} must not be empty`, key);
  }
  return trimmed;
}

function readEnum<T extends string>(
  env: EnvLike,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = readTrimmed(env, key);
  if (value === undefined) return fallback;
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new HostConfigError(
    "CONFIG_INVALID",
    `${key} must be one of: ${allowed.join(", ")}`,
    key,
  );
}

function readBoolean(env: EnvLike, key: string, fallback: boolean): boolean {
  const value = readTrimmed(env, key);
  if (value === undefined) return fallback;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new HostConfigError(
    "CONFIG_INVALID",
    `${key} must be a boolean (true/false/1/0)`,
    key,
  );
}

function readPort(env: EnvLike, key: string, fallback: number): number {
  const value = readTrimmed(env, key);
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 65_535) {
    throw new HostConfigError(
      "CONFIG_INVALID",
      `${key} must be an integer between 0 and 65535`,
      key,
    );
  }
  return parsed;
}

function defaultProfileFromNodeEnv(nodeEnv: HostNodeEnv): EnvironmentProfile {
  if (nodeEnv === "production") return "production";
  if (nodeEnv === "test") return "testing";
  return "development";
}

export function normalizeHostConfig(env: EnvLike): HostConfig {
  const node_env = readEnum(env, "NODE_ENV", NODE_ENVS, "development");
  const defaultProfile = defaultProfileFromNodeEnv(node_env);

  const enable_persistent_memory = readBoolean(
    env,
    "ENABLE_PERSISTENT_MEMORY",
    false,
  );
  const memory_file_path_raw = readTrimmed(env, "MEMORY_FILE_PATH");
  const memory_file_path = enable_persistent_memory
    ? (memory_file_path_raw ?? ".zayden-memory")
    : null;

  if (!enable_persistent_memory && memory_file_path_raw) {
    throw new HostConfigError(
      "CONFIG_CONFLICT",
      "MEMORY_FILE_PATH requires ENABLE_PERSISTENT_MEMORY=true",
      "MEMORY_FILE_PATH",
    );
  }

  return {
    host: readTrimmed(env, "HOST") ?? "127.0.0.1",
    port: readPort(env, "PORT", 8787),
    node_env,
    log_level: readEnum(env, "LOG_LEVEL", LOG_LEVELS, "info"),
    enable_api: readBoolean(env, "ENABLE_API", true),
    enable_persistent_memory,
    memory_file_path,
    default_routing_profile: readEnum(
      env,
      "DEFAULT_ROUTING_PROFILE",
      ROUTING_PROFILES,
      defaultProfile,
    ),
    local_provider_mode: readEnum(
      env,
      "LOCAL_PROVIDER_MODE",
      LOCAL_PROVIDER_MODES,
      "mock",
    ),
    readiness_strictness: readEnum(
      env,
      "READINESS_STRICTNESS",
      READINESS_STRICTNESS,
      "lenient",
    ),
  };
}
