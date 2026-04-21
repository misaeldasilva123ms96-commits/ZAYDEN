import { pathToFileURL } from "node:url";

import { HostConfigError } from "../config/env-schema.js";
import { registerGracefulShutdown } from "../bootstrap/graceful-shutdown.js";
import {
  bootstrapRuntimeHost,
  type HostLogger,
  type RuntimeBootstrapResult,
} from "../bootstrap/runtime-bootstrap.js";

class ConsoleHostLogger implements HostLogger {
  constructor(private minLevel: "debug" | "info" | "warn" | "error") {}

  setLevel(level: "debug" | "info" | "warn" | "error"): void {
    this.minLevel = level;
  }

  info(event: string, metadata?: Record<string, unknown>): void {
    this.write("info", event, metadata);
  }

  warn(event: string, metadata?: Record<string, unknown>): void {
    this.write("warn", event, metadata);
  }

  error(event: string, metadata?: Record<string, unknown>): void {
    this.write("error", event, metadata);
  }

  private write(
    level: "info" | "warn" | "error",
    event: string,
    metadata?: Record<string, unknown>,
  ): void {
    const order = { debug: 10, info: 20, warn: 30, error: 40 };
    if (order[level] < order[this.minLevel]) return;
    const line = JSON.stringify({
      kind: "zayden.host",
      level,
      event,
      ts_ms: Date.now(),
      ...(metadata ?? {}),
    });
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

function parseInitialLogLevel(
  env: NodeJS.ProcessEnv,
): "debug" | "info" | "warn" | "error" {
  const raw = env.LOG_LEVEL;
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

export async function serve(params?: {
  env?: NodeJS.ProcessEnv;
  logger?: ConsoleHostLogger;
  exit?: (code: number) => void;
}): Promise<RuntimeBootstrapResult & { shutdown: ReturnType<typeof registerGracefulShutdown> }> {
  const env = params?.env ?? process.env;
  const logger = params?.logger ?? new ConsoleHostLogger(parseInitialLogLevel(env));
  const boot = await bootstrapRuntimeHost({ env, logger });
  logger.setLevel(boot.config.log_level);

  const shutdown = registerGracefulShutdown({
    server: boot.server,
    logger,
    onShutdown: () => boot.stop(),
    exit: params?.exit,
  });

  logger.info("service.ready", {
    mode: boot.config.local_provider_mode,
    api_enabled: boot.config.enable_api,
  });

  return { ...boot, shutdown };
}

async function main(): Promise<void> {
  try {
    await serve();
  } catch (error) {
    if (error instanceof HostConfigError) {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          kind: "zayden.host",
          level: "error",
          event: "service.bootstrap_failed",
          ts_ms: Date.now(),
          code: error.code,
          key: error.key ?? null,
          message: error.message,
        }),
      );
      process.exit(1);
      return;
    }
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        kind: "zayden.host",
        level: "error",
        event: "service.bootstrap_failed",
        ts_ms: Date.now(),
        code: "CONFIG_INVALID",
        message: error instanceof Error ? error.message : "unknown bootstrap failure",
      }),
    );
    process.exit(1);
  }
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  void main();
}
