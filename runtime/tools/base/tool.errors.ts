export class ToolNotFoundError extends Error {
  readonly code = "TOOL_NOT_FOUND" as const;
  constructor(toolName: string) {
    super(`[zayden:tools] unknown tool: ${toolName}`);
    this.name = "ToolNotFoundError";
  }
}

export class ToolPermissionDeniedError extends Error {
  readonly code = "TOOL_PERMISSION_DENIED" as const;
  constructor(
    toolName: string,
    readonly reason: string,
  ) {
    super(`[zayden:tools] permission denied for ${toolName}: ${reason}`);
    this.name = "ToolPermissionDeniedError";
  }
}

export class ToolInvocationValidationError extends Error {
  readonly code = "TOOL_INVOCATION_INVALID" as const;
  constructor(
    message: string,
    readonly details?: string,
  ) {
    super(`[zayden:tools] ${message}`);
    this.name = "ToolInvocationValidationError";
  }
}

export class ToolExecutionTimeoutError extends Error {
  readonly code = "TOOL_EXECUTION_TIMEOUT" as const;
  constructor(
    readonly toolName: string,
    readonly timeout_ms: number,
  ) {
    super(`[zayden:tools] tool ${toolName} exceeded ${timeout_ms}ms`);
    this.name = "ToolExecutionTimeoutError";
  }
}

export class ToolExecutionFailedError extends Error {
  readonly code = "TOOL_EXECUTION_FAILED" as const;
  constructor(
    toolName: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(`[zayden:tools] ${toolName}: ${message}`);
    this.name = "ToolExecutionFailedError";
  }
}
