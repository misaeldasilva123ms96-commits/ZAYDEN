import type { ProviderAdapter } from "../../base/provider.interface.js";
import type { ProviderRequest, ProviderResponse } from "../../base/provider.types.js";
import { ProviderExecutionError } from "../../base/provider.errors.js";
import {
  FetchHttpClient,
  type HttpTransport,
} from "../shared/http-client.js";
import { checkGemmaLocalHealth } from "./gemma-local.health.js";

interface GemmaHttpAdapterOptions {
  id?: string;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
  simulateWhenUnavailable?: boolean;
  simulateLatencyMs?: number;
  transport?: HttpTransport;
}

function lastUserPrompt(request: ProviderRequest): string {
  return (
    [...request.payload.messages].reverse().find((m) => m.role === "user")?.content ??
    request.payload.messages.map((m) => `${m.role}: ${m.content}`).join("\n")
  );
}

function asProviderExecutionError(
  message: string,
  recoverable: boolean,
  metadata: Record<string, unknown>,
): ProviderExecutionError {
  return new ProviderExecutionError({
    contract_version: "1.0.0",
    error_type: "PROVIDER_EXECUTION_ERROR",
    message,
    origin: "provider",
    recoverable,
    metadata,
  });
}

export class GemmaHttpAdapter implements ProviderAdapter {
  readonly id: string;
  readonly kind = "local_gguf" as const;

  private readonly endpoint: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly simulateWhenUnavailable: boolean;
  private readonly simulateLatencyMs: number;
  private readonly transport: HttpTransport;

  constructor(options: GemmaHttpAdapterOptions = {}) {
    this.id = options.id ?? "gemma-http";
    this.endpoint =
      options.endpoint ?? process.env.ZAYDEN_LOCAL_HTTP_ENDPOINT ?? "http://127.0.0.1:11434";
    this.model = options.model ?? process.env.ZAYDEN_LOCAL_MODEL_NAME ?? "gemma2:2b";
    this.timeoutMs = options.timeoutMs ?? 25_000;
    this.simulateWhenUnavailable = options.simulateWhenUnavailable ?? true;
    this.simulateLatencyMs = options.simulateLatencyMs ?? 40;
    this.transport = options.transport ?? new FetchHttpClient();
  }

  async isAvailable(): Promise<boolean> {
    const health = await checkGemmaLocalHealth({
      endpoint: this.endpoint,
      endpointTimeoutMs: Math.min(this.timeoutMs, 1_500),
    });
    return health.ok || this.simulateWhenUnavailable;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    const started = Date.now();
    const prompt = lastUserPrompt(request);
    const health = await checkGemmaLocalHealth({
      endpoint: this.endpoint,
      endpointTimeoutMs: Math.min(this.timeoutMs, 2_000),
    });

    try {
      if (health.endpointReachable) {
        const payload = {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature:
              typeof request.parameters.temperature === "number"
                ? request.parameters.temperature
                : undefined,
            num_predict:
              typeof request.parameters.max_output_tokens === "number"
                ? request.parameters.max_output_tokens
                : undefined,
          },
        };
        const res = await this.transport.postJson(
          `${this.endpoint}/api/generate`,
          payload,
          this.timeoutMs,
        );

        if (!res.ok) {
          throw asProviderExecutionError(
            `HTTP bridge failed with status ${res.status}`,
            true,
            {
              endpoint: this.endpoint,
              status: res.status,
              body_preview: res.bodyText.slice(0, 512),
              execution_time_ms: Date.now() - started,
              failure_reason: "http_non_2xx",
            },
          );
        }

        if (!res.json || typeof res.json !== "object") {
          throw asProviderExecutionError(
            "Malformed provider JSON response",
            true,
            {
              endpoint: this.endpoint,
              status: res.status,
              execution_time_ms: Date.now() - started,
              failure_reason: "malformed_json",
            },
          );
        }

        const json = res.json as Record<string, unknown>;
        if (typeof json.response !== "string") {
          throw asProviderExecutionError(
            "Malformed provider payload: missing 'response' string",
            true,
            {
              endpoint: this.endpoint,
              status: res.status,
              execution_time_ms: Date.now() - started,
              failure_reason: "malformed_payload",
            },
          );
        }

        const executionTimeMs = Date.now() - started;
        return {
          contract_version: "1.0.0",
          correlation_id: request.correlation_id,
          session_id: request.session_id,
          provider_actual: {
            kind: "local_gguf",
            name: this.id,
            model: this.model,
          },
          model: this.model,
          text: json.response,
          finish_reason: typeof json.done_reason === "string" ? json.done_reason : "stop",
          usage: {
            contract_version: "1.0.0",
            input_tokens:
              typeof json.prompt_eval_count === "number" ? json.prompt_eval_count : null,
            output_tokens: typeof json.eval_count === "number" ? json.eval_count : null,
            total_tokens:
              typeof json.prompt_eval_count === "number" && typeof json.eval_count === "number"
                ? json.prompt_eval_count + json.eval_count
                : null,
            provider_usage: {
              execution_time_ms: executionTimeMs,
              bridge_mode: "http",
            },
          },
          raw_metadata: {
            provider_actual: { kind: "local_gguf", name: this.id, model: this.model },
            endpoint: this.endpoint,
            execution_time_ms: executionTimeMs,
            failure_reason: null,
            simulated: false,
            status: res.status,
          },
        };
      }

      if (!this.simulateWhenUnavailable) {
        throw asProviderExecutionError(
          "Local runtime endpoint is unavailable",
          true,
          {
            endpoint: this.endpoint,
            execution_time_ms: Date.now() - started,
            failure_reason: health.detail ?? "endpoint_unreachable",
            provider_actual: { kind: "local_gguf", name: this.id, model: this.model },
          },
        );
      }

      await new Promise((r) => setTimeout(r, this.simulateLatencyMs));
      const executionTimeMs = Date.now() - started;
      return {
        contract_version: "1.0.0",
        correlation_id: request.correlation_id,
        session_id: request.session_id,
        provider_actual: {
          kind: "local_gguf",
          name: this.id,
          model: this.model,
        },
        model: this.model,
        text: `[simulated-local:${this.model}] ${prompt}`,
        finish_reason: "stop",
        usage: {
          contract_version: "1.0.0",
          input_tokens: null,
          output_tokens: null,
          total_tokens: null,
          provider_usage: {
            bridge_mode: "simulated",
            execution_time_ms: executionTimeMs,
          },
        },
        raw_metadata: {
          provider_actual: { kind: "local_gguf", name: this.id, model: this.model },
          endpoint: this.endpoint,
          execution_time_ms: executionTimeMs,
          failure_reason: health.detail ?? "runtime_unavailable",
          simulated: true,
        },
      };
    } catch (error) {
      if (error instanceof ProviderExecutionError) {
        throw error;
      }
      throw asProviderExecutionError(
        error instanceof Error ? error.message : "Unknown provider execution error",
        true,
        {
          endpoint: this.endpoint,
          execution_time_ms: Date.now() - started,
          failure_reason: "unexpected_exception",
          provider_actual: { kind: "local_gguf", name: this.id, model: this.model },
        },
      );
    }
  }
}
