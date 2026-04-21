import type { FailureClass } from "../resilience/failure-classifier.js";
import type { ProviderRequest, ProviderResponse } from "../../contracts/index.js";

export type HarnessScenarioId =
  | "happy_path"
  | "slow_response"
  | "invalid_payload"
  | "intermittent_failure"
  | "fallback_transition";

export interface HarnessScenario {
  readonly id: HarnessScenarioId;
  readonly description: string;
  readonly request: ProviderRequest;
  /** Per-attempt behavior for a logical mock provider. */
  readonly attempts: ReadonlyArray<{
    latency_ms?: number;
    fail?: boolean;
    invalid_shape?: boolean;
    text?: string;
  }>;
  /** Optional chaos schedule keys `adapterId@attempt` for injector. */
  readonly chaos?: Readonly<Record<string, { latency_ms?: number; force_failure?: FailureClass }>>;
}

export function minimalValidRequest(): ProviderRequest {
  return {
    contract_version: "1.0.0",
    correlation_id: "harness-corr-0001",
    session_id: "harness-sess",
    payload: { messages: [{ role: "user", content: "harness ping" }] },
    parameters: {},
  };
}

export const PROVIDER_SCENARIOS: Record<HarnessScenarioId, HarnessScenario> = {
  happy_path: {
    id: "happy_path",
    description: "Valid request/response roundtrip",
    request: minimalValidRequest(),
    attempts: [{ text: "harness:ok" }],
  },
  slow_response: {
    id: "slow_response",
    description: "High latency before completion",
    request: minimalValidRequest(),
    attempts: [{ latency_ms: 5, text: "harness:slow-ok" }],
  },
  invalid_payload: {
    id: "invalid_payload",
    description: "Adapter returns contract-invalid shape",
    request: minimalValidRequest(),
    attempts: [{ invalid_shape: true }],
  },
  intermittent_failure: {
    id: "intermittent_failure",
    description: "Fails once then succeeds (retry surface)",
    request: minimalValidRequest(),
    attempts: [{ fail: true }, { text: "harness:recovered" }],
  },
  fallback_transition: {
    id: "fallback_transition",
    description: "Primary fails recoverably; secondary succeeds",
    request: minimalValidRequest(),
    attempts: [{ fail: true }, { text: "harness:fallback-ok" }],
  },
};

export function expectedResponseShape(text: string): Pick<ProviderResponse, "text" | "finish_reason"> {
  return { text, finish_reason: "stop" };
}
