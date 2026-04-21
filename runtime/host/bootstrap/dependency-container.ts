import type { Server } from "node:http";

import { createApiHttpServer } from "../../api/transport/http-server.js";
import { createContractValidators } from "../../contracts/index.js";
import { MemoryOrchestrator } from "../../core/memory-orchestrator.js";
import { ResilienceController } from "../../core/resilience-controller.js";
import { RuntimeOrchestrator } from "../../core/runtime-orchestrator.js";
import { RuntimeService } from "../../core/runtime-service.js";
import { SessionManager } from "../../memory/session/session-manager.js";
import { InMemorySessionStore } from "../../memory/session/session-store.js";
import { GemmaCliAdapter } from "../../providers/adapters/local/gemma-cli.adapter.js";
import { GemmaHttpAdapter } from "../../providers/adapters/local/gemma-http.adapter.js";
import { GemmaLocalAdapter } from "../../providers/adapters/local/gemma-local.adapter.js";
import { MockProviderAdapter } from "../../providers/adapters/mock/mock.adapter.js";
import type { ProviderAdapter } from "../../providers/base/provider.interface.js";
import { ProviderGateway, ProviderRegistry } from "../../providers/registry/provider-registry.js";
import {
  routingPolicyPatchForProfile,
} from "../../providers/routing/policy-profiles.js";
import { resolveRoutingPolicy } from "../../providers/routing/routing-policy.js";
import { ToolOrchestrator } from "../../core/tool-orchestrator.js";
import { FilePersistentMemoryStore } from "../../memory/persistence/file-memory.store.js";
import type { PersistentMemoryStore } from "../../memory/persistence/memory-store.interface.js";
import { registerBuiltinTools } from "../../tools/builtins/register-builtins.js";
import { ToolRegistry } from "../../tools/registry/tool-registry.js";
import type { HostConfig, LocalProviderMode } from "../config/env-schema.js";

function providerForMode(mode: LocalProviderMode): ProviderAdapter {
  switch (mode) {
    case "gemma-local":
      return new GemmaLocalAdapter();
    case "gemma-http":
      return new GemmaHttpAdapter();
    case "gemma-cli":
      return new GemmaCliAdapter();
    case "mock":
    default:
      return new MockProviderAdapter("mock-local");
  }
}

export interface RuntimeDependencyContainer {
  readonly config: HostConfig;
  readonly providers: ProviderRegistry;
  readonly gateway: ProviderGateway;
  readonly resilience: ResilienceController;
  readonly runtime_orchestrator: RuntimeOrchestrator;
  readonly tools: ToolRegistry;
  readonly tool_orchestrator: ToolOrchestrator;
  readonly sessions: SessionManager;
  readonly memory_store: PersistentMemoryStore | null;
  readonly memory_orchestrator: MemoryOrchestrator;
  readonly runtime_service: RuntimeService;
  readonly api_server: Server | null;
}

export function createDependencyContainer(
  config: HostConfig,
): RuntimeDependencyContainer {
  const validators = createContractValidators();

  const providers = new ProviderRegistry();
  providers.register(providerForMode(config.local_provider_mode));
  const gateway = new ProviderGateway(validators, providers);

  const resilience = new ResilienceController();
  const basePolicy = resolveRoutingPolicy(
    routingPolicyPatchForProfile(config.default_routing_profile),
  );
  const runtime_orchestrator = new RuntimeOrchestrator(
    validators,
    gateway,
    providers,
    basePolicy,
    resilience,
  );

  const tools = new ToolRegistry();
  registerBuiltinTools(tools);
  const tool_orchestrator = new ToolOrchestrator(validators, tools);

  const sessions = new SessionManager(new InMemorySessionStore());
  const memory_store = config.enable_persistent_memory
    ? new FilePersistentMemoryStore(config.memory_file_path ?? ".zayden-memory")
    : null;
  const memory_orchestrator = new MemoryOrchestrator(
    validators,
    sessions,
    memory_store ?? undefined,
  );

  const runtime_service = new RuntimeService({
    orchestrator: runtime_orchestrator,
    registry: providers,
    memoryOrchestrator: memory_orchestrator,
  });

  const api_server = config.enable_api
    ? createApiHttpServer({ runtimeService: runtime_service })
    : null;

  return {
    config,
    providers,
    gateway,
    resilience,
    runtime_orchestrator,
    tools,
    tool_orchestrator,
    sessions,
    memory_store,
    memory_orchestrator,
    runtime_service,
    api_server,
  };
}
