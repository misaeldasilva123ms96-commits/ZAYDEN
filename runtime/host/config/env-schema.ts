import type { EnvironmentProfile } from "../../providers/routing/routing-types.js";

export type HostNodeEnv = "development" | "test" | "production";
export type HostLogLevel = "debug" | "info" | "warn" | "error";
export type LocalProviderMode = "mock" | "gemma-local" | "gemma-http" | "gemma-cli";
export type ReadinessStrictness = "lenient" | "strict";

export type HostConfigErrorCode =
  | "CONFIG_INVALID"
  | "CONFIG_MISSING"
  | "CONFIG_CONFLICT";

export interface HostConfig {
  readonly host: string;
  readonly port: number;
  readonly node_env: HostNodeEnv;
  readonly log_level: HostLogLevel;
  readonly enable_api: boolean;
  readonly enable_persistent_memory: boolean;
  readonly memory_file_path: string | null;
  readonly default_routing_profile: EnvironmentProfile;
  readonly local_provider_mode: LocalProviderMode;
  readonly readiness_strictness: ReadinessStrictness;
}

export class HostConfigError extends Error {
  constructor(
    readonly code: HostConfigErrorCode,
    message: string,
    readonly key?: string,
  ) {
    super(message);
    this.name = "HostConfigError";
  }
}
