export class ZaydenTimeoutError extends Error {
  constructor(readonly timeout_ms: number) {
    super(`[zayden:timeout] exceeded ${timeout_ms}ms`);
    this.name = "ZaydenTimeoutError";
  }
}

/**
 * Enforces a hard upper bound on async work. Never blocks longer than `timeout_ms`
 * (timer resolution notwithstanding).
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout_ms: number,
): Promise<T> {
  if (!Number.isFinite(timeout_ms) || timeout_ms <= 0) {
    return await fn();
  }

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ZaydenTimeoutError(timeout_ms));
    }, timeout_ms);
  });

  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
