import type { ToolDefinition } from "../base/tool.interface.js";

/**
 * Catalog of registered tools (ids are stable runtime identifiers, typically equal to `tool_name` in calls).
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`[zayden:tools] duplicate tool id: ${tool.id}`);
    }
    if (tool.id.trim().length === 0) {
      throw new Error("[zayden:tools] tool id must be non-empty");
    }
    this.tools.set(tool.id, tool);
  }

  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  has(id: string): boolean {
    return this.tools.has(id);
  }

  listIds(): readonly string[] {
    return [...this.tools.keys()].sort((a, b) => a.localeCompare(b));
  }
}
