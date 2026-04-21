import assert from "node:assert/strict";
import test from "node:test";

import type { ToolDefinition } from "../../runtime/tools/base/tool.interface.js";
import { ToolRegistry } from "../../runtime/tools/registry/tool-registry.js";
import { echoTool } from "../../runtime/tools/builtins/echo.tool.js";

test("tool registry: register and list deterministically", () => {
  const r = new ToolRegistry();
  r.register(echoTool);
  assert.deepEqual(r.listIds(), ["echo"]);
});

test("tool registry: duplicate id throws", () => {
  const r = new ToolRegistry();
  r.register(echoTool);
  assert.throws(() => r.register(echoTool), /duplicate tool id/);
});

test("tool registry: get undefined for unknown", () => {
  const r = new ToolRegistry();
  assert.equal(r.get("missing"), undefined);
});

test("tool registry: empty id rejected", () => {
  const r = new ToolRegistry();
  const bad: ToolDefinition = {
    id: "  ",
    description: "x",
    async execute() {
      return { ok: true, payload: {} };
    },
  };
  assert.throws(() => r.register(bad), /non-empty/);
});
