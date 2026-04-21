import type { IncomingMessage, ServerResponse } from "node:http";

import type { RuntimeService } from "../../core/runtime-service.js";
import type { RequestContext } from "../transport/request-context.js";
import { logApiFromContext } from "../observability/api-logger.js";

export async function handleReadiness(
  _req: IncomingMessage,
  res: ServerResponse,
  ctx: RequestContext,
  runtime: RuntimeService,
): Promise<void> {
  const r = runtime.describeReadiness();
  const status = r.ready ? 200 : 503;
  const body = JSON.stringify({
    ready: r.ready,
    request_id: ctx.request_id,
    reason: r.reason ?? null,
  });
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(body);
  logApiFromContext(ctx, status, {
    normalized_error_code: r.ready ? null : "NOT_READY",
  });
}
