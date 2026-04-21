import type { ToolCallRecord, ToolResult } from "../base/tool.types.js";

/** Error envelope shape aligned with `error-envelope.schema.json` (validated in tests). */
export function toolFailureToErrorEnvelope(params: {
  error_type: string;
  message: string;
  recoverable: boolean;
  metadata?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    contract_version: "1.0.0",
    error_type: params.error_type,
    message: params.message,
    origin: "tool",
    recoverable: params.recoverable,
    metadata: { layer: "tool", ...(params.metadata ?? {}) },
  };
}

export function normalizeToolResultToResultField(result: ToolResult): Record<string, unknown> {
  if (result.ok) {
    return {
      contract_version: "1.0.0",
      kind: "tool_success",
      payload: result.payload,
    };
  }
  return {
    contract_version: "1.0.0",
    kind: "tool_error",
    error: toolFailureToErrorEnvelope({
      error_type: result.code,
      message: result.message,
      recoverable: result.recoverable,
      metadata: result.metadata,
    }),
  };
}

export function buildCompletedToolCall(
  pending: ToolCallRecord,
  status: "completed" | "error",
  result: Record<string, unknown> | null,
): ToolCallRecord {
  return {
    ...pending,
    status,
    result,
  };
}
