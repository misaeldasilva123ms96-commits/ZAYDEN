import type { RoutingMode, RoutingPolicy } from "./routing-types.js";

export function shouldAttemptFallback(params: {
  mode: RoutingMode;
  policy: RoutingPolicy;
  attemptIndex: number;
  hasAnotherCandidate: boolean;
  lastFailureRecoverable: boolean;
}): boolean {
  const {
    mode,
    policy,
    attemptIndex,
    hasAnotherCandidate,
    lastFailureRecoverable,
  } = params;

  if (!hasAnotherCandidate || attemptIndex < 0) return false;
  if (!policy.allow_fallback) return false;
  if (!lastFailureRecoverable) return false;

  switch (mode) {
    case "LOCAL_ONLY":
      return !policy.strict_local_only;
    case "CLOUD_ONLY":
      return !policy.strict_cloud_only;
    case "HYBRID":
      return true;
    case "SAFE_FALLBACK":
      return true;
    default:
      return false;
  }
}

export function buildFallbackOrder(params: {
  primaryId: string | null;
  policyOrder: string[];
  modeCandidates: string[];
}): string[] {
  const out: string[] = [];
  const pushUnique = (id: string | null | undefined) => {
    if (!id) return;
    if (!out.includes(id)) out.push(id);
  };

  pushUnique(params.primaryId);
  for (const id of params.policyOrder) pushUnique(id);
  for (const id of params.modeCandidates) pushUnique(id);
  return out;
}
