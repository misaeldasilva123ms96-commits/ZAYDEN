# Audit — `system_prompts_leaks` (reference material only)

## Classification

- **Bucket:** Reference-only research material
- **Trusted baseline:** No
- **Allowed uses in ZAYDEN:**
  - Study abstract patterns (structure, segmentation, safety layering concepts)
  - Comparative analysis documented in audits/phase reports
- **Forbidden uses (without explicit legal review + ADR):**
  - Verbatim copying of proprietary/system prompt text into ZAYDEN product logic
  - Embedding third-party prompts as “defaults” in shipped configuration

## Operational controls

- Material is stored under `sources/reference/system-prompts-leaks/` after unpack.
- Runtime core must not import or read this tree implicitly; any future tooling must be explicit, permissioned, and logged.

## Traceability requirement

If a future phase extracts **non-verbatim** engineering lessons, those lessons must be captured as ZAYDEN-owned documentation (`docs/decisions/*`, `docs/intake/*`) with explicit “derived insight” wording, not raw prompt dumps.
