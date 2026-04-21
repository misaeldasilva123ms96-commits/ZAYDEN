import type { ToolDefinition } from "../base/tool.interface.js";

export const clockTool: ToolDefinition = {
  id: "clock",
  description: "Returns ISO time and unix epoch ms (use context.clock_ms or arguments.override_ms for tests).",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      override_ms: { type: "number" },
    },
  },
  async execute(input, context) {
    const args = input as { override_ms?: number };
    const t =
      typeof args.override_ms === "number"
        ? args.override_ms
        : typeof context.clock_ms === "number"
          ? context.clock_ms
          : Date.now();
    return {
      ok: true,
      payload: { iso: new Date(t).toISOString(), unix_ms: t },
    };
  },
};
