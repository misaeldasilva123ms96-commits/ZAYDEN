import type { IncomingMessage, ServerResponse } from "node:http";

import type { RuntimeService } from "../../core/runtime-service.js";
import { mapPublicRequestInvalid } from "../normalization/api-errors.js";
import { assertPublicErrorPayload } from "../normalization/response-normalizer.js";
import { parseAndNormalizeChatRequest } from "../normalization/request-normalizer.js";
import type { RequestContext } from "../transport/request-context.js";
import { logApiFromContext } from "../observability/api-logger.js";

function isPublicRequestInvalid(err: unknown): err is Error & { code: string } {
  return err instanceof Error && (err as { code?: string }).code === "PUBLIC_REQUEST_INVALID";
}

export async function handleChat(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RequestContext,
  runtime: RuntimeService,
): Promise<void> {
  let bodyText = "";
  try {
    bodyText = await readBody(req);
  } catch {
    const m = mapPublicRequestInvalid(ctx.request_id, "payload too large");
    assertPublicErrorPayload(m.body);
    res.statusCode = m.status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(m.body));
    logApiFromContext(ctx, m.status, { normalized_error_code: m.body.error_code });
    return;
  }

  let json: unknown;
  try {
    json = bodyText.length === 0 ? null : JSON.parse(bodyText);
  } catch {
    const m = mapPublicRequestInvalid(ctx.request_id, "invalid JSON body");
    assertPublicErrorPayload(m.body);
    res.statusCode = m.status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(m.body));
    logApiFromContext(ctx, m.status, { normalized_error_code: m.body.error_code });
    return;
  }

  try {
    const normalized = parseAndNormalizeChatRequest(json);
    ctx.session_id = normalized.session_id;
    const outcome = await runtime.executeChat({
      request_id: ctx.request_id,
      normalized,
    });
    if (outcome.kind === "success") {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify(outcome.public_response));
      logApiFromContext(ctx, 200);
      return;
    }
    assertPublicErrorPayload(outcome.public_error);
    res.statusCode = outcome.http_status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(outcome.public_error));
    logApiFromContext(ctx, outcome.http_status, {
      normalized_error_code: outcome.public_error.error_code,
    });
  } catch (e) {
    if (isPublicRequestInvalid(e)) {
      const m = mapPublicRequestInvalid(ctx.request_id, e.message);
      assertPublicErrorPayload(m.body);
      res.statusCode = m.status;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify(m.body));
      logApiFromContext(ctx, m.status, { normalized_error_code: m.body.error_code });
      return;
    }
    throw e;
  }
}

const MAX_BODY = 512 * 1024;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
