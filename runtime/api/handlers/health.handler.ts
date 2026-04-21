import type { IncomingMessage, ServerResponse } from "node:http";

import type { RequestContext } from "../transport/request-context.js";
import { logApiFromContext } from "../observability/api-logger.js";

export async function handleHealth(
  _req: IncomingMessage,
  res: ServerResponse,
  ctx: RequestContext,
): Promise<void> {
  const body = JSON.stringify({
    status: "ok",
    request_id: ctx.request_id,
  });
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(body);
  logApiFromContext(ctx, 200);
}
