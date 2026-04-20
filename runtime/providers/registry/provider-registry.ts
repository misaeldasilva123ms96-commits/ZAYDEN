import type { ContractValidators, ProviderResponse } from "../../contracts/index.js";

import type { ProviderAdapter } from "../base/provider.interface.js";
import {
  ProviderNotFoundError,
  ProviderUnavailableError,
} from "../base/provider.errors.js";

/**
 * Registers provider adapters by stable string id (not display name).
 */
export class ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`[zayden:providers] duplicate adapter id: ${adapter.id}`);
    }
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  listIds(): readonly string[] {
    return [...this.adapters.keys()];
  }
}

/**
 * Validates provider-request, dispatches to an adapter, validates provider-response.
 * Observable/deterministic: no hidden globals; inject validators + registry.
 */
export class ProviderGateway {
  constructor(
    private readonly validators: ContractValidators,
    private readonly registry: ProviderRegistry,
  ) {}

  async execute(adapterId: string, request: unknown): Promise<ProviderResponse> {
    this.validators.assertValidProviderRequest(request);
    const req = request;
    const adapter = this.registry.get(adapterId);
    if (!adapter) {
      throw new ProviderNotFoundError(adapterId);
    }
    if (!(await adapter.isAvailable())) {
      throw new ProviderUnavailableError(adapterId);
    }
    const response = await adapter.execute(req);
    this.validators.assertValidProviderResponse(response);
    return response;
  }
}
