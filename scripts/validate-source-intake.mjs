/**
 * ZAYDEN — Source Intake Gate (Phase 1)
 *
 * Rationale:
 * - Deterministic filesystem checks (no hidden assumptions).
 * - Validates governed folder layout + artifact fingerprints recorded in docs.
 *
 * Traceability: docs/intake/PHASE-01-SOURCE-INTAKE-REPORT.md
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
  process.exitCode = 0;

  const requiredDirs = [
    join(REPO_ROOT, "docs", "architecture"),
    join(REPO_ROOT, "docs", "intake"),
    join(REPO_ROOT, "docs", "audits"),
    join(REPO_ROOT, "docs", "decisions"),
    join(REPO_ROOT, "docs", "testing"),
    join(REPO_ROOT, "runtime", "core"),
    join(REPO_ROOT, "runtime", "provider-gateway"),
    join(REPO_ROOT, "runtime", "tooling"),
    join(REPO_ROOT, "runtime", "memory"),
    join(REPO_ROOT, "runtime", "observability"),
    join(REPO_ROOT, "sources", "models", "manifests"),
  ];

  for (const d of requiredDirs) {
    must(existsSync(d) && statSync(d).isDirectory(), `Missing required directory: ${d}`);
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

  const intake = join(REPO_ROOT, "sources", "intake", "openclaude-main", "package.json");
  const clawReadme = join(REPO_ROOT, "sources", "intake", "claw-code-main", "README.md");
  const studyMain = join(REPO_ROOT, "sources", "study", "src", "main.tsx");
  const refAnthropic = join(REPO_ROOT, "sources", "reference", "system-prompts-leaks", "Anthropic");

  const missing = [intake, clawReadme, studyMain, refAnthropic].filter((p) => !existsSync(p));
  if (missing.length) {
    console.error("[zayden:intake] FAIL: unpacked vendor trees are missing.");
    for (const m of missing) console.error(`  - missing: ${m}`);
    console.error('[zayden:intake] Fix: run PowerShell: .\\scripts\\unpack-intake.ps1');
    process.exitCode = 1;
    return;
  }

  const gemmaZip = join(REPO_ROOT, "gemma-2-2b-it-f32.zip");
  const gemmaManifest = join(REPO_ROOT, "sources", "models", "manifests", "gemma-2-2b-it-f32.manifest.json");
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
          "Run an offline checksum workflow and track results in docs/intake/PHASE-01-SOURCE-INTAKE-REPORT.md.",
      );
    } else {
      console.warn(
        "[zayden:intake] WARN: gemma sha256_archive not pinned in manifest (large file). " +
          "Size check is the deterministic gate for now.",
      );
    }
  }

  console.log("[zayden:intake] PASS: source intake filesystem + fingerprint gates satisfied.");
}

main();
