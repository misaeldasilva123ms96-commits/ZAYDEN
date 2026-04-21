import { stdout } from "node:process";

import type { RequestContext } from "../transport/request-context.js";

export function logRequestStart(ctx: RequestContext): void {
  stdout.write(
    `${JSON.stringify({
      kind: "zayden.api.request",
      request_id: ctx.request_id,
      route: ctx.route,
      method: ctx.method,
      session_id: ctx.session_id ?? null,
      ts_ms: Date.now(),
    })}\n`,
  );
}
