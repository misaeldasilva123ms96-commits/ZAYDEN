import type { RuntimeErrorEnvelope } from "../../providers/routing/routing-types.js";

export interface PublicErrorBody {
  api_version: "1.0.0";
  request_id: string;
  error_code: string;
  message: string;
  recoverable: boolean;
  session_id?: string | null;
  metadata?: Record<string, unknown>;
}

export function sanitizePublicMessage(message: string): string {
  const withoutStack = message
    .split("\n")
    .filter((line) => !line.trim().startsWith("at "))
    .join(" ")
    .trim();
  return withoutStack.slice(0, 2_000) || "error";
}

export function mapPublicRequestInvalid(params: {
  request_id: string;
  message: string;
}): { status: 400; body: PublicErrorBody } {
  return {
    status: 400,
    body: {
      api_version: "1.0.0",
      request_id: params.request_id,
      error_code: "INVALID_REQUEST",
      message: sanitizePublicMessage(params.message),
      recoverable: false,
      metadata: { layer: "api" },
    },
  };
}

export function mapUnknownErrorToPublic(params: {
  request_id: string;
  error: unknown;
  session_id?: string | null;
}): { status: number; body: PublicErrorBody } {
  const message = sanitizePublicMessage(
    params.error instanceof Error ? params.error.message : "internal error",
  );
  return {
    status: 500,
    body: {
      api_version: "1.0.0",
      request_id: params.request_id,
      error_code: "INTERNAL_ERROR",
      message,
      recoverable: false,
      session_id: params.session_id ?? null,
      metadata: { layer: "api" },
    },
  };
}

export function mapRoutingEnvelopeToPublic(params: {
  request_id: string;
  envelope: RuntimeErrorEnvelope;
  session_id?: string | null;
}): { status: number; body: PublicErrorBody } {
  const code = params.envelope.error_type;
  let status = 500;
  if (code === "ROUTING_POLICY_VIOLATION" || code === "INVALID_PROVIDER_FOR_MODE") {
    status = 409;
  } else if (code === "NO_PROVIDER_AVAILABLE") {
    status = 503;
  } else if (code === "FALLBACK_NOT_ALLOWED") {
    status = 409;
  } else if (code === "PROVIDER_EXECUTION_ERROR") {
    status = 502;
  }
  return {
    status,
    body: {
      api_version: "1.0.0",
      request_id: params.request_id,
      error_code: code,
      message: sanitizePublicMessage(params.envelope.message),
      recoverable: params.envelope.recoverable,
      session_id: params.session_id ?? null,
      metadata: { origin: params.envelope.origin },
    },
  };
}
