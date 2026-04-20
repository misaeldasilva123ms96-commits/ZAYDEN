import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..");

test("artifact-hashes.json contains pinned SHA-256 for all small archives", () => {
  const p = join(REPO_ROOT, "docs", "intake", "artifact-hashes.json");
  const json = JSON.parse(readFileSync(p, "utf8"));
  const keys = ["openclaude-main.zip", "claw-code-main.zip", "src.zip", "system_prompts_leaks-main.zip"];
  for (const k of keys) {
    assert.ok(json.assets[k], `missing assets.${k}`);
    assert.match(json.assets[k].sha256, /^[0-9A-F]{64}$/, `bad sha256 for ${k}`);
    assert.ok(json.assets[k].role, `missing role for ${k}`);
  }
});

test("gemma manifest pins expected archive size and declares integration rule", () => {
  const p = join(REPO_ROOT, "sources", "models", "manifests", "gemma-2-2b-it-f32.manifest.json");
  const json = JSON.parse(readFileSync(p, "utf8"));
  assert.equal(json.asset_id, "gemma-2-2b-it-f32");
  assert.equal(json.expected_archive_size_bytes, 4629837305);
  assert.ok(String(json.integration_rule || "").includes("provider gateway"), "integration_rule should mention provider gateway");
});
