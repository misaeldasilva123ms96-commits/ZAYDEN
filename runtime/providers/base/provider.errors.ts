export interface ProviderErrorEnvelope {
  contract_version: "1.0.0";
  error_type: "PROVIDER_EXECUTION_ERROR";
  message: string;
  origin: "provider";
  recoverable: boolean;
  metadata: Record<string, unknown>;
}

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

export class ProviderExecutionError extends Error {
  readonly code = "PROVIDER_EXECUTION_ERROR" as const;
  readonly envelope: ProviderErrorEnvelope;

  constructor(envelope: ProviderErrorEnvelope) {
    super(`[zayden:providers] ${envelope.message}`);
    this.name = "ProviderExecutionError";
    this.envelope = envelope;
  }
}
