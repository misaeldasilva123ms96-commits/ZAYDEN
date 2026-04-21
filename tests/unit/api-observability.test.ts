import assert from "node:assert/strict";
import test from "node:test";

import { logApiFromContext } from "../../runtime/api/observability/api-logger.js";
import type { RequestContext } from "../../runtime/api/transport/request-context.js";

test("api observability helper emits structured access log", () => {
  const seen: string[] = [];
  const original = console.log;
  console.log = (line?: unknown) => {
    seen.push(String(line ?? ""));
  };

  try {
    const ctx: RequestContext = {
      request_id: "req-obs-1",
      start_time_ms: Date.now() - 5,
      route: "/api/chat",
      method: "POST",
      session_id: "sess-obs-1",
    };

    logApiFromContext(ctx, 200, { normalized_error_code: null });
  } finally {
    console.log = original;
  }

  assert.equal(seen.length, 1);
  const payload = JSON.parse(seen[0]) as {
    kind?: string;
    request_id?: string;
    route?: string;
    method?: string;
    status_code?: number;
    latency_ms?: number;
    session_id?: string | null;
  };
  assert.equal(payload.kind, "zayden.api.access");
  assert.equal(payload.request_id, "req-obs-1");
  assert.equal(payload.route, "/api/chat");
  assert.equal(payload.method, "POST");
  assert.equal(payload.status_code, 200);
  assert.ok((payload.latency_ms ?? -1) >= 0);
  assert.equal(payload.session_id, "sess-obs-1");
});
