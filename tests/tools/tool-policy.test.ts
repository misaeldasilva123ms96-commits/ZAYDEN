import assert from "node:assert/strict";
import test from "node:test";

import { policyAllowsAnyTool, resolveChatToolPolicy } from "../../runtime/tools/policy/tool-policy.js";
import { resolveToolPermission } from "../../runtime/tools/policy/permission-resolver.js";

test("resolveChatToolPolicy: allow_tools false denies all", () => {
  const p = resolveChatToolPolicy({
    contract_version: "1.0.0",
    allow_tools: false,
    allowed_tool_names: ["echo"],
  });
  assert.equal(p.allow_tools, false);
  assert.equal(policyAllowsAnyTool(p), false);
  assert.equal(
    resolveToolPermission({ toolName: "echo", policy: p }).granted,
    false,
  );
});

test("resolveChatToolPolicy: empty allowlist denies execution even when allow_tools true", () => {
  const p = resolveChatToolPolicy({
    contract_version: "1.0.0",
    allow_tools: true,
    allowed_tool_names: [],
  });
  assert.equal(resolveToolPermission({ toolName: "echo", policy: p }).granted, false);
});

test("resolveToolPermission: allowlist match", () => {
  const p = resolveChatToolPolicy({
    contract_version: "1.0.0",
    allow_tools: true,
    allowed_tool_names: ["echo", "clock"],
  });
  assert.equal(resolveToolPermission({ toolName: "echo", policy: p }).granted, true);
  assert.equal(resolveToolPermission({ toolName: "fail", policy: p }).granted, false);
});
