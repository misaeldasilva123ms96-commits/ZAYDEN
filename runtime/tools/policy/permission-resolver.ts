import type { ResolvedToolPolicy } from "../base/tool.types.js";

export interface PermissionResolution {
  readonly granted: boolean;
  readonly reason: string;
}

export function resolveToolPermission(params: {
  toolName: string;
  policy: ResolvedToolPolicy;
}): PermissionResolution {
  if (!params.policy.allow_tools) {
    return { granted: false, reason: "allow_tools is false" };
  }
  if (params.policy.allowed_names.size === 0) {
    return { granted: false, reason: "allowed_tool_names is empty (explicit allowlist required)" };
  }
  if (!params.policy.allowed_names.has(params.toolName)) {
    return { granted: false, reason: "tool not in allowed_tool_names" };
  }
  return { granted: true, reason: "allowlist match" };
}
