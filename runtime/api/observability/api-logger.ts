import type { RequestContext } from "../transport/request-context.js";

export interface ApiAccessLog {
  readonly request_id: string;
  readonly route: string;
  readonly method: string;
  readonly status_code: number;
  readonly latency_ms: number;
  readonly normalized_error_code?: string | null;
  readonly session_id?: string | null;
}

export function logApiAccess(entry: ApiAccessLog): void {
  const line = JSON.stringify({
    kind: "zayden.api.access",
    ...entry,
    ts_ms: Date.now(),
  });
  // eslint-disable-next-line no-console
  console.log(line);
}

export function logApiFromContext(
  ctx: RequestContext,
  status_code: number,
  extras?: { normalized_error_code?: string | null },
): void {
  logApiAccess({
    request_id: ctx.request_id,
    route: ctx.route,
    method: ctx.method,
    status_code,
    latency_ms: Math.max(0, Date.now() - ctx.start_time_ms),
    normalized_error_code: extras?.normalized_error_code ?? null,
    session_id: ctx.session_id ?? null,
  });
}
