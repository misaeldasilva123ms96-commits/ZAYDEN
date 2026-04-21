import type { ToolDefinition } from "../base/tool.interface.js";

export const echoTool: ToolDefinition = {
  id: "echo",
  description: "Echoes a string message back as structured payload.",
  inputSchema: {
    type: "object",
    additionalProperties: true,
    properties: {
      message: { type: "string" },
    },
  },
  async execute(input) {
    const args = input as { message?: unknown };
    const message = typeof args.message === "string" ? args.message : "";
    return { ok: true, payload: { echoed: message } };
  },
};
