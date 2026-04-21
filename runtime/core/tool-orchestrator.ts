import type { ContractValidators } from "../contracts/validators.js";
import { ToolInvocationValidationError } from "../tools/base/tool.errors.js";
import { ToolNotFoundError } from "../tools/base/tool.errors.js";
import { ToolPermissionDeniedError } from "../tools/base/tool.errors.js";
import type { ChatToolPolicyV1, ToolCallRecord, ToolExecutionContext, ToolExecutionObservation } from "../tools/base/tool.types.js";
import { ToolExecutor } from "../tools/execution/tool-executor.js";
import {
  buildCompletedToolCall,
  normalizeToolResultToResultField,
  toolFailureToErrorEnvelope,
} from "../tools/execution/tool-result-normalizer.js";
import { resolveToolPermission } from "../tools/policy/permission-resolver.js";
import { resolveChatToolPolicy } from "../tools/policy/tool-policy.js";
import { ToolInvocationValidator } from "../tools/policy/tool-invocation-validator.js";
import type { ToolRegistry } from "../tools/registry/tool-registry.js";

function buildObservation(params: {
  tool_call_id: string;
  tool_name: string;
  permission: "granted" | "denied";
  validation_ok: boolean;
  executed: boolean;
  duration_ms: number;
  error_code?: string;
  execution_path: string[];
}): ToolExecutionObservation {
  return {
    tool_call_id: params.tool_call_id,
    tool_name: params.tool_name,
    permission: params.permission,
    validation_ok: params.validation_ok,
    executed: params.executed,
    duration_ms: params.duration_ms,
    error_code: params.error_code,
    execution_path: [...params.execution_path],
  };
}

/**
 * Policy-gated tool execution. The only supported entrypoint for running tools in Phase 7.
 */
export class ToolOrchestrator {
  private readonly invocationValidator: ToolInvocationValidator;

  constructor(
    private readonly validators: ContractValidators,
    private readonly registry: ToolRegistry,
    private readonly executor: ToolExecutor = new ToolExecutor(),
  ) {
    this.invocationValidator = new ToolInvocationValidator(validators);
  }

  async executeToolCall(params: {
    chat_tool_policy: ChatToolPolicyV1;
    tool_call: unknown;
    session_id: string;
    correlation_id?: string;
    timeout_ms?: number;
    /** Deterministic clock for builtins/tests (epoch ms). */
    clock_ms?: number;
  }): Promise<{ tool_call: ToolCallRecord; observation: ToolExecutionObservation }> {
    const started = Date.now();
    const trace: string[] = [];
    const emit = (path: string, detail?: Record<string, unknown>) => {
      trace.push(detail ? `${path}:${JSON.stringify(detail)}` : path);
    };

    try {
      emit("TOOL_ORCH_START");
      const policy = resolveChatToolPolicy(params.chat_tool_policy);
      const pending = this.invocationValidator.assertValidPendingToolCall(params.tool_call);
      emit("TOOL_CALL_VALID", { id: pending.tool_call_id, tool: pending.tool_name });

      const tool = this.registry.get(pending.tool_name);
      if (!tool) {
        const err = new ToolNotFoundError(pending.tool_name);
        const result = toolFailureToErrorEnvelope({
          error_type: err.code,
          message: err.message,
          recoverable: false,
          metadata: { tool_name: pending.tool_name },
        });
        const completed = buildCompletedToolCall(pending, "error", result);
        return {
          tool_call: completed,
          observation: buildObservation({
            tool_call_id: pending.tool_call_id,
            tool_name: pending.tool_name,
            permission: "denied",
            validation_ok: true,
            executed: false,
            duration_ms: Date.now() - started,
            error_code: err.code,
            execution_path: trace,
          }),
        };
      }

      const perm = resolveToolPermission({ toolName: pending.tool_name, policy });
      if (!perm.granted) {
        const err = new ToolPermissionDeniedError(pending.tool_name, perm.reason);
        const result = toolFailureToErrorEnvelope({
          error_type: err.code,
          message: err.message,
          recoverable: false,
          metadata: { reason: perm.reason },
        });
        const completed = buildCompletedToolCall(pending, "error", result);
        return {
          tool_call: completed,
          observation: buildObservation({
            tool_call_id: pending.tool_call_id,
            tool_name: pending.tool_name,
            permission: "denied",
            validation_ok: true,
            executed: false,
            duration_ms: Date.now() - started,
            error_code: err.code,
            execution_path: trace,
          }),
        };
      }

      this.invocationValidator.validateArgumentsForTool(tool, pending.arguments);
      emit("TOOL_ARGS_VALID");

      const context: ToolExecutionContext = {
        session_id: params.session_id,
        correlation_id: params.correlation_id,
        trace,
        clock_ms: params.clock_ms,
        emit,
      };

      const timeout_ms = params.timeout_ms ?? 30_000;
      const execResult = await this.executor.run({
        tool,
        arguments: pending.arguments,
        context,
        timeout_ms,
      });

      const normalized = normalizeToolResultToResultField(execResult);
      const status = execResult.ok ? "completed" : "error";
      const completed = buildCompletedToolCall(pending, status, normalized);
      emit("TOOL_ORCH_DONE", { status });

      return {
        tool_call: completed,
        observation: buildObservation({
          tool_call_id: pending.tool_call_id,
          tool_name: pending.tool_name,
          permission: "granted",
          validation_ok: true,
          executed: true,
          duration_ms: Date.now() - started,
          error_code: execResult.ok ? undefined : execResult.code,
          execution_path: trace,
        }),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "tool orchestration failed";
      const code =
        error instanceof ToolInvocationValidationError ? error.code : "TOOL_ORCHESTRATION_ERROR";
      const pending: ToolCallRecord = (() => {
        const raw = params.tool_call;
        if (raw && typeof raw === "object") {
          const o = raw as Record<string, unknown>;
          const id = typeof o.tool_call_id === "string" ? o.tool_call_id : "unknown";
          const name = typeof o.tool_name === "string" ? o.tool_name : "unknown";
          const args =
            o.arguments && typeof o.arguments === "object" && !Array.isArray(o.arguments)
              ? (o.arguments as Record<string, unknown>)
              : {};
          return {
            contract_version: "1.0.0",
            tool_call_id: id,
            tool_name: name,
            arguments: args,
            status: "pending",
          };
        }
        return {
          contract_version: "1.0.0",
          tool_call_id: "unknown",
          tool_name: "unknown",
          arguments: {},
          status: "pending",
        };
      })();

      const result = toolFailureToErrorEnvelope({
        error_type: code,
        message,
        recoverable: error instanceof ToolInvocationValidationError,
        metadata: {
          details: error instanceof ToolInvocationValidationError ? error.details : undefined,
        },
      });
      const completed = buildCompletedToolCall(pending, "error", result);
      return {
        tool_call: completed,
        observation: buildObservation({
          tool_call_id: pending.tool_call_id,
          tool_name: pending.tool_name,
          permission: "denied",
          validation_ok: false,
          executed: false,
          duration_ms: Date.now() - started,
          error_code: code,
          execution_path: trace,
        }),
      };
    }
  }
}
