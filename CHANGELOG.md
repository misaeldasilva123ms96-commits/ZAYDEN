# Changelog

All notable changes to this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to **Semantic Versioning** for ZAYDEN-owned packages once published (currently `0.0.0` private scaffold).

## [Unreleased]

### Added

- Phase 1 governed repository scaffold (architecture docs, audits, ADRs)
- Deterministic intake unpack script (`scripts/unpack-intake.ps1`)
- Deterministic intake validator (`scripts/validate-source-intake.mjs`)
- Pinned artifact fingerprint registry (`docs/intake/artifact-hashes.json`)
- Gemma model manifest metadata (`sources/models/manifests/gemma-2-2b-it-f32.manifest.json`)
- Baseline tests (`test/intake-registry.test.mjs`)
- Runtime layer scaffolds and observability event schema stub
