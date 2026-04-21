/**
 * Tool runtime types (Phase 7). Not JSON Schema mirrors — keep aligned with tool-call envelope usage.
 */

export interface ToolExecutionContext {
  readonly session_id: string;
  readonly correlation_id?: string;
  /** Append-only trace for observability (deterministic ordering); mutated only via `emit`. */
  trace: string[];
  /** Optional deterministic clock override (tests); otherwise tools use real time. */
  readonly clock_ms?: number;
  readonly emit: (path: string, detail?: Record<string, unknown>) => void;
}

/** Structured tool outcome before normalization into `tool_call.result`. */
export type ToolResult =
  | {
      ok: true;
      payload: Record<string, unknown>;
    }
  | {
      ok: false;
      code: string;
      message: string;
      recoverable: boolean;
      metadata?: Record<string, unknown>;
    };

/** Narrow view of chat `tool_policy` used by the permission layer. */
export interface ChatToolPolicyV1 {
  contract_version: "1.0.0";
  allow_tools?: boolean | null;
  allowed_tool_names?: string[] | null;
}

export interface ResolvedToolPolicy {
  readonly allow_tools: boolean;
  /** When non-empty, only these tool ids may execute (registry id === tool_name). */
  readonly allowed_names: ReadonlySet<string>;
}

/** Pending/completed tool call shape compatible with `tool-call.schema.json` usage. */
export interface ToolCallRecord {
  contract_version: "1.0.0";
  tool_call_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "completed" | "error";
  result?: Record<string, unknown> | null;
}

export interface ToolExecutionObservation {
  readonly tool_call_id: string;
  readonly tool_name: string;
  readonly permission: "granted" | "denied";
  readonly validation_ok: boolean;
  readonly executed: boolean;
  readonly duration_ms: number;
  readonly error_code?: string;
  readonly execution_path: readonly string[];
}
