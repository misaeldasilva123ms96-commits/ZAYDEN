import { setTimeout as sleep } from "node:timers/promises";

export interface HttpResponseData {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  bodyText: string;
  json?: unknown;
}

export interface HttpTransport {
  postJson(url: string, body: unknown, timeoutMs: number): Promise<HttpResponseData>;
}

export class FetchHttpClient implements HttpTransport {
  async postJson(url: string, body: unknown, timeoutMs: number): Promise<HttpResponseData> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const bodyText = await res.text();
      let parsed: unknown;
      try {
        parsed = bodyText.length > 0 ? JSON.parse(bodyText) : undefined;
      } catch {
        parsed = undefined;
      }
      const headers: Record<string, string> = {};
      for (const [k, v] of res.headers.entries()) headers[k] = v;
      return { ok: res.ok, status: res.status, headers, bodyText, json: parsed };
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function pingEndpoint(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    await sleep(0);
  }
}
