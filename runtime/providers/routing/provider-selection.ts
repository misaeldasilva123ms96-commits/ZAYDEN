import { buildFallbackOrder } from "./fallback-policy.js";
import type {
  AdapterCatalogEntry,
  RoutingErrorCode,
  RoutingMode,
  RoutingPolicy,
} from "./routing-types.js";

export interface SelectionPlan {
  mode: RoutingMode;
  selectedOrder: string[];
  warnings: string[];
}

export interface SelectionFailure {
  code: RoutingErrorCode;
  message: string;
  metadata: Record<string, unknown>;
}

export function isLocalKind(kind: AdapterCatalogEntry["kind"]): boolean {
  return kind === "local_gguf" || kind === "ollama";
}

export function isCloudKind(kind: AdapterCatalogEntry["kind"]): boolean {
  return kind === "openai_compatible" || kind === "gemini";
}

function sortById(a: AdapterCatalogEntry, b: AdapterCatalogEntry): number {
  return a.id.localeCompare(b.id);
}

function modeCandidates(
  catalog: AdapterCatalogEntry[],
  mode: RoutingMode,
): AdapterCatalogEntry[] {
  switch (mode) {
    case "LOCAL_ONLY":
      return catalog.filter((a) => isLocalKind(a.kind));
    case "CLOUD_ONLY":
      return catalog.filter((a) => isCloudKind(a.kind));
    case "HYBRID":
    case "SAFE_FALLBACK":
      return catalog;
    default:
      return [];
  }
}

function modePreferredId(mode: RoutingMode, policy: RoutingPolicy): string | null {
  if (mode === "LOCAL_ONLY") return policy.preferred_local_provider;
  if (mode === "CLOUD_ONLY") return policy.preferred_cloud_provider;
  if (mode === "HYBRID") {
    return policy.hybrid_preference === "cloud_first"
      ? policy.preferred_cloud_provider
      : policy.preferred_local_provider;
  }
  // SAFE_FALLBACK starts from local preference if present.
  return policy.preferred_local_provider ?? policy.preferred_cloud_provider;
}

export function selectProviderOrder(params: {
  catalog: AdapterCatalogEntry[];
  mode: RoutingMode;
  requestedProvider: string | null;
  policy: RoutingPolicy;
}): SelectionPlan | SelectionFailure {
  const sortedCatalog = [...params.catalog].sort(sortById);
  const candidates = modeCandidates(sortedCatalog, params.mode);
  const availableCandidates = candidates.filter((a) => a.available);
  const modeIds = candidates.map((a) => a.id);
  const modePolicyOrder = params.policy.fallback_order.filter((id) => modeIds.includes(id));
  const warnings: string[] = [];

  if (params.requestedProvider) {
    const requested = sortedCatalog.find((a) => a.id === params.requestedProvider);
    if (!requested) {
      return {
        code: "NO_PROVIDER_AVAILABLE",
        message: `Requested provider not registered: ${params.requestedProvider}`,
        metadata: { requested_provider: params.requestedProvider, mode: params.mode },
      };
    }
    if (params.mode === "LOCAL_ONLY" && !isLocalKind(requested.kind)) {
      return {
        code: "INVALID_PROVIDER_FOR_MODE",
        message: `Provider ${requested.id} is not local for mode LOCAL_ONLY`,
        metadata: { requested_provider: requested.id, kind: requested.kind },
      };
    }
    if (params.mode === "CLOUD_ONLY" && !isCloudKind(requested.kind)) {
      return {
        code: "INVALID_PROVIDER_FOR_MODE",
        message: `Provider ${requested.id} is not cloud for mode CLOUD_ONLY`,
        metadata: { requested_provider: requested.id, kind: requested.kind },
      };
    }
    return {
      mode: params.mode,
      selectedOrder: buildFallbackOrder({
        primaryId: requested.id,
        policyOrder: modePolicyOrder,
        modeCandidates: modeIds,
      }),
      warnings,
    };
  }

  if (candidates.length === 0) {
    return {
      code: "NO_PROVIDER_AVAILABLE",
      message: `No providers registered for mode ${params.mode}`,
      metadata: { mode: params.mode },
    };
  }
  if (availableCandidates.length === 0) {
    warnings.push(`No currently available providers for mode ${params.mode}`);
  }

  const preferredId = modePreferredId(params.mode, params.policy);
  const preferredExists = preferredId ? modeIds.includes(preferredId) : false;
  if (preferredId && !preferredExists) {
    warnings.push(`preferred provider ${preferredId} not registered for mode ${params.mode}`);
  }

  const fallbackPrimary =
    modeIds.find((id) => availableCandidates.some((c) => c.id === id)) ?? modeIds[0] ?? null;

  return {
    mode: params.mode,
    selectedOrder: buildFallbackOrder({
      primaryId: preferredExists ? preferredId : fallbackPrimary,
      policyOrder: modePolicyOrder,
      modeCandidates: modeIds,
    }),
    warnings,
  };
}
