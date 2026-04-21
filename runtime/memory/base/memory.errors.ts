export class MemorySessionError extends Error {
  constructor(
    readonly code:
      | "SESSION_NOT_FOUND"
      | "SESSION_INVALID"
      | "MEMORY_STORE_UNAVAILABLE"
      | "MEMORY_ENTRY_INVALID"
      | "MEMORY_POLICY_VIOLATION",
    message: string,
  ) {
    super(`[zayden:memory] ${message}`);
    this.name = "MemorySessionError";
  }
}

export class MemoryBudgetSignal extends Error {
  readonly code = "CONTEXT_BUDGET_EXCEEDED" as const;
  constructor(message: string) {
    super(`[zayden:memory] ${message}`);
    this.name = "MemoryBudgetSignal";
  }
}
