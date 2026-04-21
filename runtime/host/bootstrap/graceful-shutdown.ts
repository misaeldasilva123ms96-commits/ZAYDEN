import type { Server } from "node:http";

import type { HostLogger } from "./runtime-bootstrap.js";

type SignalProcess = Pick<NodeJS.Process, "on" | "off">;

function noopLogger(): HostLogger {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
  };
}

function closeServer(server: Server | null): Promise<void> {
  if (!server || !server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

export interface GracefulShutdownController {
  dispose(): void;
  trigger(signal: NodeJS.Signals): Promise<void>;
}

export function registerGracefulShutdown(params: {
  server: Server | null;
  logger?: HostLogger;
  processRef?: SignalProcess;
  signals?: readonly NodeJS.Signals[];
  onShutdown?: () => Promise<void> | void;
  exit?: (code: number) => void;
}): GracefulShutdownController {
  const logger = params.logger ?? noopLogger();
  const processRef = params.processRef ?? process;
  const signals = params.signals ?? (["SIGINT", "SIGTERM"] as const);
  const exit = params.exit ?? ((code: number) => process.exit(code));
  let shutdownPromise: Promise<void> | null = null;

  const trigger = async (signal: NodeJS.Signals): Promise<void> => {
    if (shutdownPromise) {
      logger.warn("service.shutdown_already_in_progress", { signal });
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      logger.info("service.shutdown_initiated", { signal });
      try {
        await closeServer(params.server);
        await params.onShutdown?.();
        logger.info("service.shutdown_completed", { signal });
        exit(0);
      } catch (error) {
        logger.error("service.shutdown_failed", {
          signal,
          error: error instanceof Error ? error.message : "unknown",
        });
        exit(1);
      }
    })();

    return shutdownPromise;
  };

  const handlers = new Map<NodeJS.Signals, () => void>();
  for (const signal of signals) {
    const listener = () => {
      void trigger(signal);
    };
    handlers.set(signal, listener);
    processRef.on(signal, listener);
  }

  return {
    dispose(): void {
      for (const [signal, listener] of handlers) {
        processRef.off(signal, listener);
      }
      handlers.clear();
    },
    trigger,
  };
}
