import type {
  ProviderActual,
  ProviderKind,
  ProviderRequest,
  ProviderResponse,
  RequestedMode,
} from "../../contracts/index.js";

export type RoutingMode = RequestedMode;

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
  simulation_policy?: {
    allow_simulated_local_fallback?: boolean;
  };
  hybrid_preference?: "local_first" | "cloud_first";
}

export interface RoutingRequestInput {
  request: ProviderRequest;
  requested_mode: RoutingMode;
  requested_provider?: string | null;
  policy?: Partial<RoutingPolicy>;
}

export interface RoutingResult {
  response: ProviderResponse | null;
  error: RuntimeErrorEnvelope | null;
  runtime_mode: RoutingMode;
  provider_requested: string | null;
  provider_actual: ProviderActual | null;
  fallback_reason: { did_fallback: boolean; code?: string | null; detail?: string | null } | null;
  observability: RuntimeInspectionView;
}
