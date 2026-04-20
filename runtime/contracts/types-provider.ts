/**
 * TypeScript mirrors of Phase 2 JSON Schemas for provider-request / provider-response.
 * Keep in sync with `*.schema.json`; change only via ADR + schema bump.
 */

export type ProviderKind =
  | "openai_compatible"
  | "gemini"
  | "ollama"
  | "local_gguf"
  | "unknown";

export type ProviderMessageRole = "system" | "user" | "assistant" | "tool";

export interface ProviderRequestMessage {
  role: ProviderMessageRole;
  content: string;
}

export interface ProviderRequestPayload {
  messages: ProviderRequestMessage[];
}

export interface ProviderRequestParameters {
  temperature?: number | null;
  max_output_tokens?: number | null;
  [key: string]: unknown;
}

export interface ProviderRequest {
  contract_version: "1.0.0";
  correlation_id: string;
  session_id: string;
  /** Optional; omit or set null when not used. */
  provider_hint?: string | null;
  payload: ProviderRequestPayload;
  parameters: ProviderRequestParameters;
}

export interface ProviderActual {
  kind: ProviderKind;
  name: string;
  model: string | null;
}

export interface ProviderResponseUsage {
  contract_version: "1.0.0";
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  provider_usage?: Record<string, unknown>;
}

export interface ProviderResponse {
  contract_version: "1.0.0";
  correlation_id: string;
  session_id: string;
  provider_actual: ProviderActual;
  model: string | null;
  text: string;
  finish_reason: string | null;
  usage: ProviderResponseUsage;
  raw_metadata?: Record<string, unknown>;
}
