import { existsSync } from "node:fs";

import { pingEndpoint } from "../shared/http-client.js";

export interface GemmaLocalHealth {
  ok: boolean;
  endpointConfigured: boolean;
  endpointReachable: boolean;
  binaryConfigured: boolean;
  binaryExists: boolean;
  ggufConfigured: boolean;
  ggufPathExists: boolean;
  detail?: string;
}

interface HealthOptions {
  endpoint?: string;
  endpointTimeoutMs?: number;
}

/**
 * Health passes when at least one execution bridge is plausible:
 * - endpoint reachable (HTTP mode)
 * - binary exists (CLI mode)
 * - GGUF env configured (degraded/simulated mode may still run)
 */
export async function checkGemmaLocalHealth(
  options: HealthOptions = {},
): Promise<GemmaLocalHealth> {
  const endpoint =
    options.endpoint ?? process.env.ZAYDEN_LOCAL_HTTP_ENDPOINT ?? "http://127.0.0.1:11434";
  const endpointTimeoutMs = options.endpointTimeoutMs ?? 1500;

  const binaryPath = process.env.ZAYDEN_GEMMA_CLI_CMD ?? "";
  const zipPath = process.env.ZAYDEN_GGUF_ZIP_PATH;
  const ggufPath = process.env.ZAYDEN_GGUF_PATH;

  const endpointConfigured = endpoint.length > 0;
  const endpointReachable = endpointConfigured
    ? await pingEndpoint(endpoint, endpointTimeoutMs)
    : false;

  const binaryConfigured = binaryPath.length > 0;
  const binaryExists = binaryConfigured && existsSync(binaryPath);

  const ggufConfigured = Boolean(zipPath || ggufPath);
  const ggufPathExists = Boolean(
    (zipPath && existsSync(zipPath)) || (ggufPath && existsSync(ggufPath)),
  );

  const ok = endpointReachable || binaryExists || ggufConfigured;

  let detail = "health_ok";
  if (!ok) {
    detail =
      "No reachable endpoint, no valid CLI binary, and no GGUF env configuration";
  } else if (!endpointReachable) {
    detail = "endpoint_unreachable";
  }

  return {
    ok,
    endpointConfigured,
    endpointReachable,
    binaryConfigured,
    binaryExists,
    ggufConfigured,
    ggufPathExists,
    detail,
  };
}
