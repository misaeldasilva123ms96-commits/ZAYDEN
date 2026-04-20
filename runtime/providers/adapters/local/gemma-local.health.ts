import { existsSync } from "node:fs";

/**
 * Minimal health signal for the local GGUF path (no inference).
 * Uses optional env `ZAYDEN_GGUF_ZIP_PATH` pointing at the zip or extracted `.gguf`.
 */
export async function checkGemmaLocalHealth(): Promise<{
  ok: boolean;
  detail?: string;
}> {
  const zipPath = process.env.ZAYDEN_GGUF_ZIP_PATH;
  const ggufPath = process.env.ZAYDEN_GGUF_PATH;
  if (!zipPath && !ggufPath) {
    return {
      ok: false,
      detail: "Neither ZAYDEN_GGUF_ZIP_PATH nor ZAYDEN_GGUF_PATH is set",
    };
  }
  if (zipPath && !existsSync(zipPath)) {
    return { ok: false, detail: `ZAYDEN_GGUF_ZIP_PATH not found: ${zipPath}` };
  }
  if (ggufPath && !existsSync(ggufPath)) {
    return { ok: false, detail: `ZAYDEN_GGUF_PATH not found: ${ggufPath}` };
  }
  return { ok: true };
}
