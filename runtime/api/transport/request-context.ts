export interface RequestContext {
  readonly request_id: string;
  readonly start_time_ms: number;
  readonly route: string;
  readonly method: string;
  session_id?: string;
  readonly caller_metadata?: Record<string, unknown>;
}

export function createRequestContext(params: {
  request_id: string;
  route: string;
  method: string;
  session_id?: string;
  caller_metadata?: Record<string, unknown>;
}): RequestContext {
  return {
    request_id: params.request_id,
    start_time_ms: Date.now(),
    route: params.route,
    method: params.method,
    session_id: params.session_id,
    caller_metadata: params.caller_metadata,
  };
}
