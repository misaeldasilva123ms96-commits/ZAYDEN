import { ZaydenTimeoutError, withTimeout } from "../../providers/resilience/timeout-controller.js";
import type { ToolDefinition } from "../base/tool.interface.js";
import { ToolExecutionFailedError } from "../base/tool.errors.js";
import type { ToolExecutionContext, ToolResult } from "../base/tool.types.js";

/**
 * Single execution boundary for tool `execute` — invoked only after policy + validation.
 */
export class ToolExecutor {
  async run(params: {
    tool: ToolDefinition;
    arguments: Record<string, unknown>;
    context: ToolExecutionContext;
    timeout_ms: number;
  }): Promise<ToolResult> {
    const { tool, arguments: args, context, timeout_ms } = params;
    context.emit("TOOL_EXECUTE_START", { tool: tool.id });
    try {
      const out = await withTimeout(
        () => tool.execute(args, context),
        timeout_ms,
      );
      if (!out || typeof out !== "object" || !("ok" in out)) {
        return {
          ok: false,
          code: "TOOL_BAD_RETURN",
          message: "tool returned a non-ToolResult value",
          recoverable: false,
          metadata: { tool: tool.id },
        };
      }
      const tr = out as ToolResult;
      if (tr.ok !== true && tr.ok !== false) {
        return {
          ok: false,
          code: "TOOL_BAD_RETURN",
          message: "tool returned malformed ToolResult",
          recoverable: false,
          metadata: { tool: tool.id },
        };
      }
      context.emit("TOOL_EXECUTE_DONE", { tool: tool.id, ok: tr.ok });
      return tr;
    } catch (error) {
      if (error instanceof ZaydenTimeoutError) {
        context.emit("TOOL_EXECUTE_TIMEOUT", { tool: tool.id });
        return {
          ok: false,
          code: "TOOL_TIMEOUT",
          message: `tool exceeded ${timeout_ms}ms`,
          recoverable: true,
          metadata: { tool: tool.id, timeout_ms },
        };
      }
      if (error instanceof ToolExecutionFailedError) {
        context.emit("TOOL_EXECUTE_THROW", { tool: tool.id });
        return {
          ok: false,
          code: "TOOL_EXECUTION_FAILED",
          message: error.message,
          recoverable: true,
          metadata: { tool: tool.id },
        };
      }
      const message = error instanceof Error ? error.message : "unknown error";
      context.emit("TOOL_EXECUTE_UNHANDLED", { tool: tool.id });
      return {
        ok: false,
        code: "TOOL_UNHANDLED_EXCEPTION",
        message,
        recoverable: false,
        metadata: { tool: tool.id },
      };
    }
  }
}
