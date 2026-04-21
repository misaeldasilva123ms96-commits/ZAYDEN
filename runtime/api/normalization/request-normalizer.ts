import type { RoutingMode } from "../../contracts/index.js";
import type { MemoryPolicy } from "../../memory/base/memory.types.js";
import { resolveMemoryPolicy } from "../../memory/policy/memory-policy.js";
import type { RoutingPolicy } from "../../providers/routing/routing-types.js";
import type { ChatToolPolicyV1 } from "../../tools/base/tool.types.js";
import { getPublicApiValidators } from "./public-validators.js";

export interface NormalizedChatInput {
  readonly session_id: string;
  readonly input: string;
  readonly mode: RoutingMode;
  readonly provider: string | null;
  /** Merged into `RuntimeOrchestrator.route({ policy })` (partial only). */
  readonly routing_policy_override: Partial<RoutingPolicy>;
  readonly tool_policy: ChatToolPolicyV1;
  readonly memory_policy: MemoryPolicy;
  readonly ensure_session: boolean;
  readonly metadata: Record<string, unknown>;
}

export function parseAndNormalizeChatRequest(body: unknown): NormalizedChatInput {
  const v = getPublicApiValidators().validatePublicChatRequest;
  if (!v(body)) {
    const detail = v.errors ? JSON.stringify(v.errors) : "invalid";
    throw Object.assign(new Error(`invalid public chat request: ${detail}`), {
      code: "PUBLIC_REQUEST_INVALID",
    });
  }
  const o = body as Record<string, unknown>;
  const routing_policy_override: Partial<RoutingPolicy> =
    o.routing_policy && typeof o.routing_policy === "object" && !Array.isArray(o.routing_policy)
      ? { ...(o.routing_policy as Partial<RoutingPolicy>) }
      : {};
  const memory = resolveMemoryPolicy(
    o.memory_policy && typeof o.memory_policy === "object" && !Array.isArray(o.memory_policy)
      ? (o.memory_policy as Partial<MemoryPolicy>)
      : {},
  );
  const rawTool =
    o.tool_policy && typeof o.tool_policy === "object" && !Array.isArray(o.tool_policy)
      ? (o.tool_policy as Partial<ChatToolPolicyV1>)
      : {};
  const tool_policy: ChatToolPolicyV1 = {
    contract_version: "1.0.0",
    ...rawTool,
  };
  const ensure_session =
    typeof o.ensure_session === "boolean" ? o.ensure_session : true;
  const metadata =
    o.metadata && typeof o.metadata === "object" && !Array.isArray(o.metadata)
      ? (o.metadata as Record<string, unknown>)
      : {};
  return {
    session_id: String(o.session_id),
    input: String(o.input),
    mode: o.mode as RoutingMode,
    provider: o.provider === null || o.provider === undefined ? null : String(o.provider),
    routing_policy_override,
    tool_policy,
    memory_policy: memory,
    ensure_session,
    metadata,
  };
}
