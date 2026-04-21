import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import type { RuntimeService } from "../../core/runtime-service.js";
import { handleChat } from "../handlers/chat.handler.js";
import { handleHealth } from "../handlers/health.handler.js";
import { handleReadiness } from "../handlers/readiness.handler.js";
import { assertPublicErrorPayload } from "../normalization/response-normalizer.js";
import { mapUnknownErrorToPublic } from "../normalization/api-errors.js";
import { logApiFromContext } from "../observability/api-logger.js";
import { logRequestStart } from "../middleware/request-logging.js";
import { createRequestContext } from "./request-context.js";

export interface ApiServerDependencies {
  readonly runtimeService: RuntimeService;
}

export async function dispatchApi(
  req: IncomingMessage,
  res: ServerResponse,
  deps: ApiServerDependencies,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const path = url.pathname;
  const method = (req.method ?? "GET").toUpperCase();
  const request_id = randomUUID();
  const ctx = createRequestContext({
    request_id,
    route: path,
    method,
  });
  logRequestStart(ctx);

  try {
    if (method === "GET" && path === "/api/health") {
      await handleHealth(req, res, ctx);
      return;
    }
    if (method === "GET" && path === "/api/readiness") {
      await handleReadiness(req, res, ctx, deps.runtimeService);
      return;
    }
    if (method === "POST" && path === "/api/chat") {
      await handleChat(req, res, ctx, deps.runtimeService);
      return;
    }

    const notFound = {
      api_version: "1.0.0" as const,
      request_id,
      error_code: "NOT_FOUND",
      message: "route not found",
      recoverable: false,
      session_id: null as string | null,
      metadata: { route: `${method} ${path}` },
    };
    assertPublicErrorPayload(notFound);
    res.statusCode = 404;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(notFound));
    logApiFromContext(ctx, 404, { normalized_error_code: "NOT_FOUND" });
  } catch (e) {
    const mapped = mapUnknownErrorToPublic({ request_id, error: e, session_id: ctx.session_id ?? null });
    assertPublicErrorPayload(mapped.body);
    if (!res.headersSent) {
      res.statusCode = mapped.status;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify(mapped.body));
    }
    logApiFromContext(ctx, mapped.status, {
      normalized_error_code: mapped.body.error_code,
    });
  }
}
