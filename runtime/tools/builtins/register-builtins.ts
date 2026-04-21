import type { ToolRegistry } from "../registry/tool-registry.js";
import { clockTool } from "./clock.tool.js";
import { echoTool } from "./echo.tool.js";
import { failTool } from "./fail.tool.js";

export function registerBuiltinTools(registry: ToolRegistry): void {
  registry.register(echoTool);
  registry.register(clockTool);
  registry.register(failTool);
}
