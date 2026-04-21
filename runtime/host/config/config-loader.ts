import { normalizeHostConfig } from "./config-normalizer.js";
import { HostConfigError, type HostConfig } from "./env-schema.js";

export function loadHostConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): HostConfig {
  try {
    return normalizeHostConfig(env);
  } catch (error) {
    if (error instanceof HostConfigError) {
      throw error;
    }
    throw new HostConfigError(
      "CONFIG_INVALID",
      error instanceof Error ? error.message : "failed to load host config",
    );
  }
}
