import type { ServerResponse } from "node:http";

import { assertPublicErrorPayload } from "../normalization/response-normalizer.js";
import { mapUnknownErrorToPublic } from "../normalization/api-errors.js";

export async function runWithApiErrorBoundary(
  request_id: string,
  res: ServerResponse,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (e) {
    const mapped = mapUnknownErrorToPublic({ request_id, error: e, session_id: null });
    assertPublicErrorPayload(mapped.body);
    if (!res.headersSent) {
      res.statusCode = mapped.status;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify(mapped.body));
    }
  }
}
