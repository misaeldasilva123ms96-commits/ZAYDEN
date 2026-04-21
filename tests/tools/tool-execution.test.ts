import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, outcome } from "../../runtime/contracts/index.js";
import { ToolOrchestrator } from "../../runtime/core/tool-orchestrator.js";
import type { ToolDefinition } from "../../runtime/tools/base/tool.interface.js";
import { registerBuiltinTools } from "../../runtime/tools/builtins/register-builtins.js";
import { ToolRegistry } from "../../runtime/tools/registry/tool-registry.js";

function policyAllowing(names: string[]) {
  return {
    contract_version: "1.0.0" as const,
    allow_tools: true as const,
    allowed_tool_names: names,
  };
}

function pending(name: string, args: Record<string, unknown> = {}) {
  return {
    contract_version: "1.0.0" as const,
    tool_call_id: "tc-exec-1",
    tool_name: name,
    arguments: args,
    status: "pending" as const,
  };
}

test("valid echo execution completes with contract-valid tool_call", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { tool_call, observation } = await orch.executeToolCall({
    chat_tool_policy: policyAllowing(["echo"]),
    tool_call: pending("echo", { message: "hi" }),
    session_id: "s1",
  });
  assert.equal(tool_call.status, "completed");
  assert.equal(observation.executed, true);
  assert.equal(observation.permission, "granted");
  assert.equal(outcome(v.validateToolCall, tool_call).ok, true);
});

test("unknown tool is rejected before execution", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { tool_call, observation } = await orch.executeToolCall({
    chat_tool_policy: policyAllowing(["echo", "clock"]),
    tool_call: pending("missing-tool"),
    session_id: "s1",
  });
  assert.equal(tool_call.status, "error");
  assert.equal(observation.executed, false);
  assert.equal(observation.error_code, "TOOL_NOT_FOUND");
});

test("malformed arguments rejected by tool inputSchema", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { observation } = await orch.executeToolCall({
    chat_tool_policy: policyAllowing(["echo"]),
    tool_call: pending("echo", { message: 123 } as unknown as Record<string, unknown>),
    session_id: "s1",
  });
  assert.equal(observation.validation_ok, false);
  assert.equal(observation.executed, false);
});

test("malformed tool_call fails validation", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { observation } = await orch.executeToolCall({
    chat_tool_policy: policyAllowing(["echo"]),
    tool_call: { not: "a tool call" },
    session_id: "s1",
  });
  assert.equal(observation.validation_ok, false);
  assert.equal(observation.executed, false);
});

test("permission denied when tool not allowlisted", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  registerBuiltinTools(registry);
  const orch = new ToolOrchestrator(v, registry);
  const { tool_call, observation } = await orch.executeToolCall({
    chat_tool_policy: policyAllowing(["echo"]),
    tool_call: pending("clock"),
    session_id: "s1",
  });
  assert.equal(tool_call.status, "error");
  assert.equal(observation.permission, "denied");
  assert.equal(observation.error_code, "TOOL_PERMISSION_DENIED");
});

test("tool timeout returns structured failure", async () => {
  const v = createContractValidators();
  const registry = new ToolRegistry();
  const slow: ToolDefinition = {
    id: "slow",
    description: "sleeps",
    async execute() {
      await new Promise((r) => setTimeout(r, 80));
      return { ok: true, payload: { done: true } };
    },
  };
  registry.register(slow);
  const orch = new ToolOrchestrator(v, registry);
  const { tool_call, observation } = await orch.executeToolCall({
    chat_tool_policy: policyAllowing(["slow"]),
    tool_call: pending("slow"),
    session_id: "s1",
    timeout_ms: 15,
  });
  assert.equal(tool_call.status, "error");
  assert.equal(observation.executed, true);
  const res = tool_call.result as { kind?: string; error?: Record<string, unknown> };
  assert.equal(res?.kind, "tool_error");
  assert.equal((res?.error as { error_type?: string })?.error_type, "TOOL_TIMEOUT");
});
