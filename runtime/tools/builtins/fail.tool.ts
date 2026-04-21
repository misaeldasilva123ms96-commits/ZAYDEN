import type { ToolDefinition } from "../base/tool.interface.js";
import { ToolExecutionFailedError } from "../base/tool.errors.js";

export const failTool: ToolDefinition = {
  id: "fail",
  description: "Deterministic failure surface: returns structured failure or throws.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      mode: { type: "string", enum: ["return", "throw"] },
    },
  },
  async execute(input) {
    const args = input as { mode?: string };
    const mode = args.mode ?? "return";
    if (mode === "throw") {
      throw new ToolExecutionFailedError("fail", "simulated throw", undefined);
    }
    return {
      ok: false,
      code: "TOOL_FAIL_REQUESTED",
      message: "fail tool returned error",
      recoverable: true,
      metadata: { mode: "return" },
    };
  },
};
