import type { ProviderKind, ProviderRequest, ProviderResponse } from "./provider.types.js";

/**
 * Pluggable provider implementation. All adapters must honor Phase 2 contracts.
 */
export interface ProviderAdapter {
  readonly id: string;
  readonly kind: ProviderKind;
  isAvailable(): Promise<boolean>;
  execute(request: ProviderRequest): Promise<ProviderResponse>;
}
