import type { ToolExecutionContext } from "./tool.types.js";
import type { ToolResult } from "./tool.types.js";

/**
 * Executable tool definition. Tools never self-authorize — `ToolOrchestrator` + policy gate execution.
 */
export interface ToolDefinition {
  readonly id: string;
  readonly description: string;
  /** Optional JSON Schema (draft-2020-12 object) for `arguments` validation. */
  readonly inputSchema?: object;
  execute(input: unknown, context: ToolExecutionContext): Promise<ToolResult>;
}
