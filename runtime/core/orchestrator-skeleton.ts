import { createContractValidators } from "../contracts/index.js";
import { MockProviderAdapter } from "../providers/adapters/mock/mock.adapter.js";
import { ProviderGateway, ProviderRegistry } from "../providers/registry/provider-registry.js";

/**
 * Minimal composition root for later runtime orchestration (Phase 3 skeleton).
 * No routing policy yet — only wires validators + registry + gateway.
 */
export function createProviderOrchestrationShell(): {
  gateway: ProviderGateway;
  registry: ProviderRegistry;
} {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new MockProviderAdapter("mock"));
  const gateway = new ProviderGateway(validators, registry);
  return { gateway, registry };
}
