import type { ChatToolPolicyV1, ResolvedToolPolicy } from "../base/tool.types.js";

/**
 * Deterministic resolution of chat-layer tool policy.
 *
 * Rules:
 * - `allow_tools === false` → deny all tools.
 * - Otherwise, only tool names listed in `allowed_tool_names` (non-empty) may run.
 * - Missing or empty `allowed_tool_names` → deny all (explicit allowlist required).
 */
export function resolveChatToolPolicy(raw: ChatToolPolicyV1): ResolvedToolPolicy {
  if (raw.contract_version !== "1.0.0") {
    throw new Error("[zayden:tools] unsupported tool_policy.contract_version");
  }
  if (raw.allow_tools === false) {
    return { allow_tools: false, allowed_names: new Set() };
  }
  const names = raw.allowed_tool_names ?? [];
  const allowed_names = new Set(names.filter((n) => typeof n === "string" && n.trim().length > 0));
  return { allow_tools: true, allowed_names };
}

export function policyAllowsAnyTool(policy: ResolvedToolPolicy): boolean {
  return policy.allow_tools && policy.allowed_names.size > 0;
}
