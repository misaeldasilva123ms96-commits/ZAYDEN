export class ProviderNotFoundError extends Error {
  readonly code = "PROVIDER_NOT_FOUND" as const;
  constructor(adapterId: string) {
    super(`[zayden:providers] adapter not registered: ${adapterId}`);
    this.name = "ProviderNotFoundError";
  }
}

export class ProviderUnavailableError extends Error {
  readonly code = "PROVIDER_UNAVAILABLE" as const;
  constructor(adapterId: string, detail?: string) {
    super(
      `[zayden:providers] adapter unavailable: ${adapterId}` +
        (detail ? ` (${detail})` : ""),
    );
    this.name = "ProviderUnavailableError";
  }
}

export class ProviderContractError extends Error {
  readonly code = "PROVIDER_CONTRACT_VIOLATION" as const;
  constructor(message: string) {
    super(`[zayden:providers] ${message}`);
    this.name = "ProviderContractError";
  }
}
