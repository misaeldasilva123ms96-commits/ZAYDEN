import type {
  ProviderActual,
  ProviderKind,
  ProviderRequest,
  ProviderResponse,
  RequestedMode,
} from "../../contracts/index.js";
import type { FailureClass } from "../resilience/failure-classifier.js";
import type { RetryPolicy } from "../resilience/retry-policy.js";

export type RoutingMode = RequestedMode;

export type EnvironmentProfile = "development" | "testing" | "production";

export type RoutingErrorCode =
  | "ROUTING_POLICY_VIOLATION"
  | "NO_PROVIDER_AVAILABLE"
  | "INVALID_PROVIDER_FOR_MODE"
  | "FALLBACK_NOT_ALLOWED";

export interface RuntimeErrorEnvelope {
  contract_version: "1.0.0";
  error_type: RoutingErrorCode | "PROVIDER_EXECUTION_ERROR";
  message: string;
  origin: "runtime" | "provider";
  recoverable: boolean;
  metadata: Record<string, unknown>;
}

export interface RuntimeInspectionView {
  contract_version: "1.0.0";
  runtime_mode: RoutingMode;
  execution_path: string[];
  provider_chain: Array<{ name: string; kind: ProviderKind }>;
  fallback_triggered: boolean;
  tool_execution_count: number;
  latency_ms: number;
  warnings: string[];
}

export interface AdapterCatalogEntry {
  id: string;
  kind: ProviderKind;
  available: boolean;
}

export interface RoutingPolicy {
  default_mode: RoutingMode;
  preferred_local_provider: string | null;
  preferred_cloud_provider: string | null;
  allow_fallback: boolean;
  fallback_order: string[];
  strict_local_only: boolean;
  strict_cloud_only: boolean;
  timeout_policy?: {
    per_attempt_ms?: number;
    total_ms?: number;
  };
  retry_policy?: RetryPolicy;
  simulation_policy?: {
    allow_simulated_local_fallback?: boolean;
  };
  hybrid_preference?: "local_first" | "cloud_first";
}

/** Serializable chaos plan (tests / harness). Disabled unless `enabled: true`. */
export interface ChaosPlan {
  enabled: boolean;
  schedule?: Readonly<
    Record<string, { latency_ms?: number; force_failure?: FailureClass }>
  >;
}

/**
 * Resilience metrics are kept outside `RuntimeInspectionView` because runtime-inspection.schema.json
 * forbids additional properties; mirror key lines into `warnings` / `execution_path` for Ajv payloads.
 */
export interface ResilienceTelemetry {
  retry_count: number;
  timeout_triggered: boolean;
  failure_type: FailureClass | null;
  chaos_applied: boolean;
  execution_attempts: number;
}

export interface RoutingRequestInput {
  request: ProviderRequest;
  requested_mode: RoutingMode;
  requested_provider?: string | null;
  policy?: Partial<RoutingPolicy>;
  environment_profile?: EnvironmentProfile;
  simulation?: {
    chaos?: ChaosPlan;
  };
}

export interface RoutingResult {
  response: ProviderResponse | null;
  error: RuntimeErrorEnvelope | null;
  runtime_mode: RoutingMode;
  provider_requested: string | null;
  provider_actual: ProviderActual | null;
  fallback_reason: { did_fallback: boolean; code?: string | null; detail?: string | null } | null;
  observability: RuntimeInspectionView;
  resilience?: ResilienceTelemetry;
}
