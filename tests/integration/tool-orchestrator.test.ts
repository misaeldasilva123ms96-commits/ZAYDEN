import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, outcome } from "../../runtime/contracts/index.js";
import { ToolOrchestrator } from "../../runtime/core/tool-orchestrator.js";
import { registerBuiltinTools } from "../../runtime/tools/builtins/register-builtins.js";
import { ToolRegistry } from "../../runtime/tools/registry/tool-registry.js";

function allow(names: string[]) {
  return {
    contract_version: "1.0.0" as const,
    allow_tools: true as const,
    allowed_tool_names: names,
  };
}

function pending(name: string, args: Record<string, unknown> = {}) {
  return {
    contract_version: "1.0.0" as const,
    tool_call_id: "tc-int-1",
    tool_name: name,
    arguments: args,
    status: "pending" as const,
  };
}

test("integration: clock tool is deterministic with clock_ms override", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const fixed = 1_704_000_000_000;
  const { tool_call } = await orch.executeToolCall({
    chat_tool_policy: allow(["clock"]),
    tool_call: pending("clock", {}),
    session_id: "sess-int",
    clock_ms: fixed,
  });
  assert.equal(tool_call.status, "completed");
  const result = tool_call.result as { kind?: string; payload?: { unix_ms?: number } };
  assert.equal(result?.kind, "tool_success");
  assert.equal(result?.payload?.unix_ms, fixed);
  assert.equal(outcome(v.validateToolCall, tool_call).ok, true);
});

test("integration: fail tool throw-mode normalizes to tool_error", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { tool_call } = await orch.executeToolCall({
    chat_tool_policy: allow(["fail"]),
    tool_call: pending("fail", { mode: "throw" }),
    session_id: "sess-int",
  });
  assert.equal(tool_call.status, "error");
  const inner = (tool_call.result as { kind?: string; error?: { error_type?: string } }).error;
  assert.equal((tool_call.result as { kind?: string }).kind, "tool_error");
  assert.equal(inner?.error_type, "TOOL_EXECUTION_FAILED");
});

test("integration: fail tool return-mode surfaces tool_error envelope", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { tool_call } = await orch.executeToolCall({
    chat_tool_policy: allow(["fail"]),
    tool_call: pending("fail", { mode: "return" }),
    session_id: "sess-int",
  });
  assert.equal(tool_call.status, "error");
  const inner = (tool_call.result as { error?: unknown }).error;
  assert.equal(outcome(v.validateErrorEnvelope, inner).ok, true);
});

test("integration: execution path is observable and ordered", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { observation } = await orch.executeToolCall({
    chat_tool_policy: allow(["echo"]),
    tool_call: pending("echo", { message: "x" }),
    session_id: "sess-int",
  });
  assert.ok(observation.execution_path.includes("TOOL_ORCH_START"));
  assert.ok(observation.execution_path.some((p) => p.startsWith("TOOL_EXECUTE_START")));
});
