/**
 * ZAYDEN runtime contracts (stub)
 *
 * Traceability:
 * - docs/decisions/ADR-0001-repository-layout-and-source-isolation.md
 * - docs/decisions/ADR-0002-research-layout-and-phase1-foundation.md
 * - docs/architecture/LAYER-MODEL.md
 *
 * NOTE: This file is ZAYDEN-owned. It must not import code from `research/source-*`.
 */

/** @typedef {'local' | 'cloud' | 'hybrid'} ZaydenRuntimeMode */

/** @typedef {'openai_compatible' | 'gemini' | 'ollama' | 'local_gguf' | 'unknown'} ZaydenProviderKind */

/**
 * Normalized identifiers for observability (never silently swallow unknowns).
 * @typedef {Object} ZaydenProviderActual
 * @property {ZaydenProviderKind} kind
 * @property {string} name
 * @property {string | null} model
 */

/**
 * @typedef {Object} ZaydenFallbackReason
 * @property {boolean} did_fallback
 * @property {string | null} code
 * @property {string | null} detail
 */

export const ZAYDEN_CONTRACT_VERSION = "0.1.0";
