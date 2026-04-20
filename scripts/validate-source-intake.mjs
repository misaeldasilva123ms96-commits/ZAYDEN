/**
 * ZAYDEN — Source Intake Gate (Phase 0/1)
 *
 * Traceability:
 * - docs/audits/SOURCE-CLASSIFICATION-MATRIX.md
 * - docs/phases/phase-01-repository-foundation.md
 * - docs/runbooks/intake.md
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..");

function must(cond, msg) {
  if (!cond) {
    console.error(`[zayden:intake] FAIL: ${msg}`);
    process.exit(1);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256File(path) {
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex").toUpperCase();
}

function main() {
  const requiredDirs = [
    join(REPO_ROOT, "apps", "cli"),
    join(REPO_ROOT, "apps", "api"),
    join(REPO_ROOT, "apps", "ui"),
    join(REPO_ROOT, "runtime", "core"),
    join(REPO_ROOT, "runtime", "contracts"),
    join(REPO_ROOT, "runtime", "providers"),
    join(REPO_ROOT, "runtime", "tools"),
    join(REPO_ROOT, "runtime", "memory"),
    join(REPO_ROOT, "runtime", "observability"),
    join(REPO_ROOT, "research"),
    join(REPO_ROOT, "research", "source-models", "manifests"),
    join(REPO_ROOT, "tests", "unit"),
    join(REPO_ROOT, "tests", "integration"),
    join(REPO_ROOT, "tests", "contracts"),
    join(REPO_ROOT, "tests", "regression"),
    join(REPO_ROOT, "tests", "fixtures"),
    join(REPO_ROOT, "tests", "mocks"),
    join(REPO_ROOT, "docs", "architecture"),
    join(REPO_ROOT, "docs", "audits"),
    join(REPO_ROOT, "docs", "decisions"),
    join(REPO_ROOT, "docs", "intake"),
    join(REPO_ROOT, "docs", "phases"),
    join(REPO_ROOT, "docs", "runbooks"),
    join(REPO_ROOT, "docs", "providers"),
    join(REPO_ROOT, "docs", "testing"),
    join(REPO_ROOT, ".github", "workflows"),
  ];

  for (const d of requiredDirs) {
    must(existsSync(d) && statSync(d).isDirectory(), `Missing required directory: ${d}`);
  }

  must(
    existsSync(join(REPO_ROOT, "docs", "audits", "SOURCE-CLASSIFICATION-MATRIX.md")),
    "Missing Phase 0 gate artifact: docs/audits/SOURCE-CLASSIFICATION-MATRIX.md",
  );

  const forensic = [
    "openclaude-audit.md",
    "claw-code-audit.md",
    "src-partial-audit.md",
    "system-prompts-research-audit.md",
    "gemma-model-audit.md",
  ];
  for (const f of forensic) {
    must(existsSync(join(REPO_ROOT, "docs", "audits", f)), `Missing forensic audit: docs/audits/${f}`);
  }

  const phase2Contracts = [
    "chat-request.schema.json",
    "chat-response.schema.json",
    "provider-request.schema.json",
    "provider-response.schema.json",
    "tool-call.schema.json",
    "runtime-inspection.schema.json",
    "error-envelope.schema.json",
    "memory-context.schema.json",
    "index.ts",
    "validators.ts",
    "schema-ids.ts",
  ];
  for (const f of phase2Contracts) {
    must(
      existsSync(join(REPO_ROOT, "runtime", "contracts", f)),
      `Missing Phase 2 contract artifact: runtime/contracts/${f}`,
    );
  }
  must(
    existsSync(join(REPO_ROOT, "docs", "architecture", "runtime-contracts.md")),
    "Missing Phase 2 contract documentation: docs/architecture/runtime-contracts.md",
  );

  const phase3Gateway = [
    join(REPO_ROOT, "runtime", "providers", "base", "provider.interface.ts"),
    join(REPO_ROOT, "runtime", "providers", "base", "provider.types.ts"),
    join(REPO_ROOT, "runtime", "providers", "base", "provider.errors.ts"),
    join(REPO_ROOT, "runtime", "providers", "registry", "provider-registry.ts"),
    join(REPO_ROOT, "runtime", "providers", "adapters", "mock", "mock.adapter.ts"),
    join(REPO_ROOT, "runtime", "providers", "adapters", "local", "gemma-local.adapter.ts"),
    join(REPO_ROOT, "runtime", "providers", "adapters", "local", "gemma-local.health.ts"),
    join(REPO_ROOT, "runtime", "core", "orchestrator-skeleton.ts"),
    join(REPO_ROOT, "docs", "architecture", "openclaude-adaptation-plan.md"),
  ];
  for (const p of phase3Gateway) {
    must(existsSync(p), `Missing Phase 3 gateway artifact: ${p}`);
  }

  const hashesPath = join(REPO_ROOT, "docs", "intake", "artifact-hashes.json");
  must(existsSync(hashesPath), `Missing fingerprint registry: ${hashesPath}`);
  const registry = readJson(hashesPath);

  const smallZips = [
    { rel: "openclaude-main.zip", expectedSha256: registry.assets["openclaude-main.zip"].sha256 },
    { rel: "claw-code-main.zip", expectedSha256: registry.assets["claw-code-main.zip"].sha256 },
    { rel: "src.zip", expectedSha256: registry.assets["src.zip"].sha256 },
    { rel: "system_prompts_leaks-main.zip", expectedSha256: registry.assets["system_prompts_leaks-main.zip"].sha256 },
  ];

  for (const z of smallZips) {
    const p = join(REPO_ROOT, z.rel);
    must(existsSync(p), `Missing archive at repo root: ${z.rel}`);
    const actual = sha256File(p);
    must(
      actual === z.expectedSha256,
      `SHA256 mismatch for ${z.rel}. expected=${z.expectedSha256} actual=${actual}`,
    );
  }

  const intake = join(REPO_ROOT, "research", "source-openclaude", "package.json");
  const clawReadme = join(REPO_ROOT, "research", "source-claw-code", "README.md");
  const studyMain = join(REPO_ROOT, "research", "source-src-partial", "main.tsx");
  const refAnthropic = join(REPO_ROOT, "research", "source-prompts-reference", "Anthropic");

  const missing = [intake, clawReadme, studyMain, refAnthropic].filter((p) => !existsSync(p));
  if (missing.length) {
    console.error("[zayden:intake] FAIL: unpacked research trees are missing.");
    for (const m of missing) console.error(`  - missing: ${m}`);
    console.error('[zayden:intake] Fix: run PowerShell: .\\scripts\\unpack-intake.ps1');
    process.exit(1);
  }

  const gemmaZip = join(REPO_ROOT, "gemma-2-2b-it-f32.zip");
  const gemmaManifest = join(
    REPO_ROOT,
    "research",
    "source-models",
    "manifests",
    "gemma-2-2b-it-f32.manifest.json",
  );
  must(existsSync(gemmaManifest), `Missing model manifest: ${gemmaManifest}`);
  const manifest = readJson(gemmaManifest);

  if (!existsSync(gemmaZip)) {
    console.warn(
      `[zayden:intake] WARN (non-fatal): model archive missing: ${gemmaZip}. ` +
        `Recorded expected size_bytes=${manifest.expected_archive_size_bytes}. ` +
        "This is expected on machines that keep the GGUF outside the repo.",
    );
  } else {
    const st = statSync(gemmaZip);
    must(
      typeof manifest.expected_archive_size_bytes === "number",
      "Model manifest missing expected_archive_size_bytes",
    );
    must(
      st.size === manifest.expected_archive_size_bytes,
      `Gemma zip size mismatch. expected=${manifest.expected_archive_size_bytes} actual=${st.size}`,
    );

    if (typeof manifest.sha256_archive === "string" && manifest.sha256_archive.length === 64) {
      console.warn(
        "[zayden:intake] WARN: gemma sha256_archive is pinned, but this validator intentionally does not hash multi-GB archives by default. " +
          "Run an offline checksum workflow and track results in docs/phases/phase-01-repository-foundation.md.",
      );
    } else {
      console.warn(
        "[zayden:intake] WARN: gemma sha256_archive not pinned in manifest (large file). " +
          "Size check is the deterministic gate for now.",
      );
    }
  }

  console.log("[zayden:intake] PASS: Phase 0/1 filesystem + fingerprint gates satisfied.");
}

main();
