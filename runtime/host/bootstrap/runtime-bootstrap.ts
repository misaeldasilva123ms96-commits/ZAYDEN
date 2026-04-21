import type { AddressInfo } from "node:net";

import { listenApiServer } from "../../api/transport/http-server.js";
import { loadHostConfigFromEnv } from "../config/config-loader.js";
import type { HostConfig } from "../config/env-schema.js";
import {
  createDependencyContainer,
  type RuntimeDependencyContainer,
} from "./dependency-container.js";

export interface HostLogger {
  info(event: string, metadata?: Record<string, unknown>): void;
  warn(event: string, metadata?: Record<string, unknown>): void;
  error(event: string, metadata?: Record<string, unknown>): void;
}

function defaultHostLogger(): HostLogger {
  const write = (
    level: "info" | "warn" | "error",
    event: string,
    metadata?: Record<string, unknown>,
  ) => {
    const line = JSON.stringify({
      kind: "zayden.host",
      level,
      event,
      ts_ms: Date.now(),
      ...(metadata ?? {}),
    });
    // eslint-disable-next-line no-console
    console.log(line);
  };
  return {
    info: (event, metadata) => write("info", event, metadata),
    warn: (event, metadata) => write("warn", event, metadata),
    error: (event, metadata) => write("error", event, metadata),
  };
}

function closeServer(server: RuntimeDependencyContainer["api_server"]): Promise<void> {
  if (!server || !server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

export interface RuntimeBootstrapResult {
  readonly config: HostConfig;
  readonly container: RuntimeDependencyContainer;
  readonly server: RuntimeDependencyContainer["api_server"];
  stop(): Promise<void>;
}

export async function bootstrapRuntimeHost(params?: {
  env?: NodeJS.ProcessEnv;
  config?: HostConfig;
  logger?: HostLogger;
}): Promise<RuntimeBootstrapResult> {
  const logger = params?.logger ?? defaultHostLogger();
  logger.info("service.starting");

  const config = params?.config ?? loadHostConfigFromEnv(params?.env ?? process.env);
  logger.info("service.config_loaded", {
    host: config.host,
    port: config.port,
    enable_api: config.enable_api,
    local_provider_mode: config.local_provider_mode,
    enable_persistent_memory: config.enable_persistent_memory,
  });

  const container = createDependencyContainer(config);
  if (container.api_server && config.enable_api) {
    await listenApiServer(container.api_server, config.port, config.host);
    const address = container.api_server.address() as AddressInfo | null;
    logger.info("service.server_listening", {
      host: address?.address ?? config.host,
      port: address?.port ?? config.port,
    });
  } else {
    logger.warn("service.api_disabled");
  }

  return {
    config,
    container,
    server: container.api_server,
    async stop(): Promise<void> {
      await closeServer(container.api_server);
    },
  };
}
