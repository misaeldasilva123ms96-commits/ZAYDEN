import {
  ProviderContractError,
  ProviderExecutionError,
  ProviderNotFoundError,
  ProviderUnavailableError,
} from "../base/provider.errors.js";
import { ZaydenTimeoutError } from "./timeout-controller.js";

export type FailureClass =
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR"
  | "MALFORMED_RESPONSE"
  | "NON_RECOVERABLE_ERROR";

export interface FailureAttributes {
  recoverable: boolean;
  fallback_allowed: boolean;
  retry_allowed: boolean;
}

/** Deterministic mapping: classification drives retry/fallback gates (no hidden policy). */
export const FAILURE_ATTRIBUTES: Record<FailureClass, FailureAttributes> = {
  TIMEOUT: { recoverable: true, fallback_allowed: true, retry_allowed: true },
  NETWORK_ERROR: { recoverable: true, fallback_allowed: true, retry_allowed: true },
  PROVIDER_ERROR: { recoverable: true, fallback_allowed: true, retry_allowed: true },
  MALFORMED_RESPONSE: {
    recoverable: false,
    fallback_allowed: true,
    retry_allowed: false,
  },
  NON_RECOVERABLE_ERROR: {
    recoverable: false,
    fallback_allowed: false,
    retry_allowed: false,
  },
};

export interface ClassifiedFailure {
  class: FailureClass;
  recoverable: boolean;
  fallback_allowed: boolean;
  retry_allowed: boolean;
}

export function attributesFor(className: FailureClass): FailureAttributes {
  return FAILURE_ATTRIBUTES[className];
}

export class ChaosInducedError extends Error {
  constructor(readonly failureClass: FailureClass) {
    super(`[zayden:chaos] induced ${failureClass}`);
    this.name = "ChaosInducedError";
  }
}

export function classifyFailure(error: unknown): ClassifiedFailure {
  if (error instanceof ChaosInducedError) {
    const c = error.failureClass;
    return { class: c, ...FAILURE_ATTRIBUTES[c] };
  }
  if (error instanceof ZaydenTimeoutError) {
    const c = "TIMEOUT" as const;
    return { class: c, ...FAILURE_ATTRIBUTES[c] };
  }
  if (error instanceof ProviderNotFoundError) {
    const c = "NON_RECOVERABLE_ERROR" as const;
    const a = FAILURE_ATTRIBUTES[c];
    return { class: c, ...a };
  }
  if (error instanceof ProviderUnavailableError) {
    const c = "NETWORK_ERROR" as const;
    const a = FAILURE_ATTRIBUTES[c];
    return { class: c, ...a };
  }
  if (error instanceof ProviderContractError) {
    const c = "MALFORMED_RESPONSE" as const;
    const a = FAILURE_ATTRIBUTES[c];
    return { class: c, ...a };
  }
  if (error instanceof ProviderExecutionError) {
    if (!error.envelope.recoverable) {
      const c = "NON_RECOVERABLE_ERROR" as const;
      const a = FAILURE_ATTRIBUTES[c];
      return { class: c, ...a };
    }
    const c = "PROVIDER_ERROR" as const;
    const a = FAILURE_ATTRIBUTES[c];
    return { class: c, ...a };
  }
  if (error instanceof Error) {
    if (
      error.message.includes("[zayden:contracts]") &&
      error.message.includes("provider-response")
    ) {
      const c = "MALFORMED_RESPONSE" as const;
      return { class: c, ...FAILURE_ATTRIBUTES[c] };
    }
    const msg = error.message.toLowerCase();
    if (msg.includes("timeout") || msg.includes("timed out")) {
      const c = "TIMEOUT" as const;
      return { class: c, ...FAILURE_ATTRIBUTES[c] };
    }
    if (msg.includes("network") || msg.includes("econnrefused") || msg.includes("enotfound")) {
      const c = "NETWORK_ERROR" as const;
      return { class: c, ...FAILURE_ATTRIBUTES[c] };
    }
  }
  const c = "NON_RECOVERABLE_ERROR" as const;
  return { class: c, ...FAILURE_ATTRIBUTES[c] };
}
