import type { ProviderAdapter } from "../../base/provider.interface.js";
import type { ProviderRequest, ProviderResponse } from "../../base/provider.types.js";
import { ProviderExecutionError } from "../../base/provider.errors.js";
import { runProcess } from "../shared/process-runner.js";

interface GemmaCliAdapterOptions {
  id?: string;
  command?: string;
  args?: readonly string[];
  timeoutMs?: number;
}

function toExecutionError(
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

export class GemmaCliAdapter implements ProviderAdapter {
  readonly id: string;
  readonly kind = "local_gguf" as const;

  private readonly command: string;
  private readonly args: readonly string[];
  private readonly timeoutMs: number;

  constructor(options: GemmaCliAdapterOptions = {}) {
    this.id = options.id ?? "gemma-cli";
    this.command = options.command ?? process.env.ZAYDEN_GEMMA_CLI_CMD ?? "";
    this.args = options.args ?? [];
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  async isAvailable(): Promise<boolean> {
    return this.command.length > 0;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    const started = Date.now();
    if (!(await this.isAvailable())) {
      throw toExecutionError("CLI command not configured", true, {
        failure_reason: "missing_cli_command",
        execution_time_ms: Date.now() - started,
      });
    }

    const prompt =
      [...request.payload.messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const result = await runProcess(this.command, [...this.args, prompt], {
      timeoutMs: this.timeoutMs,
    });

    if (result.exitCode !== 0) {
      throw toExecutionError("CLI execution failed", true, {
        exit_code: result.exitCode,
        stderr: result.stderr.slice(0, 512),
        execution_time_ms: result.executionTimeMs,
        failure_reason: "non_zero_exit",
      });
    }

    const text = result.stdout.trim();
    if (!text) {
      throw toExecutionError("CLI returned empty output", true, {
        execution_time_ms: result.executionTimeMs,
        failure_reason: "empty_stdout",
      });
    }

    return {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: {
        kind: "local_gguf",
        name: this.id,
        model: process.env.ZAYDEN_LOCAL_MODEL_NAME ?? "gemma-2-2b-it-f32",
      },
      model: process.env.ZAYDEN_LOCAL_MODEL_NAME ?? "gemma-2-2b-it-f32",
      text,
      finish_reason: "stop",
      usage: {
        contract_version: "1.0.0",
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        provider_usage: {
          bridge_mode: "cli",
          execution_time_ms: result.executionTimeMs,
        },
      },
      raw_metadata: {
        execution_time_ms: result.executionTimeMs,
        provider_actual: { kind: "local_gguf", name: this.id },
        failure_reason: null,
        command: this.command,
      },
    };
  }
}
