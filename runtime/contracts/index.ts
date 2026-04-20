/**
 * ZAYDEN runtime contracts — public surface (Phase 2).
 *
 * Constraint: no imports from `research/` or third-party runtime trees.
 */

export { SCHEMA_IDS } from "./schema-ids.js";
export { createContractValidators, outcome } from "./validators.js";
export type {
  ProviderActual,
  ProviderKind,
  ProviderRequest,
  ProviderRequestMessage,
  ProviderRequestParameters,
  ProviderRequestPayload,
  ProviderResponse,
  ProviderResponseUsage,
} from "./types-provider.js";
export type {
  ContractValidators,
  ValidationFailure,
  ValidationOutcome,
  ValidationResult,
} from "./validators.js";

export const CONTRACT_RUNTIME_VERSION = "1.0.0" as const;

/** Stable fingerprint for contract-shape regression tests. Bump only with ADR + migration plan. */
export const CONTRACT_STABILITY_FINGERPRINT = "zayden.runtime.contracts@v1.0.0";

export const CHAT_REQUEST_REQUIRED_TOP_LEVEL = [
  "contract_version",
  "session_id",
  "input",
  "system_policy",
  "tool_policy",
  "memory_context",
  "requested_mode",
  "metadata",
] as const;

export const CHAT_RESPONSE_REQUIRED_TOP_LEVEL = [
  "contract_version",
  "session_id",
  "output",
  "runtime_mode",
  "provider_requested",
  "provider_actual",
  "model",
  "fallback_reason",
  "tool_calls",
  "observability",
  "usage",
  "error",
] as const;

export type RequestedMode =
  | "LOCAL_ONLY"
  | "CLOUD_ONLY"
  | "HYBRID"
  | "SAFE_FALLBACK";

export type ErrorOrigin = "runtime" | "provider" | "tool";

export type ToolCallStatus = "pending" | "completed" | "error";

export interface FallbackReason {
  did_fallback: boolean;
  code?: string | null;
  detail?: string | null;
}
