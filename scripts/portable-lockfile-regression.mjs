import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { normalizeLockfile } from "./portable-lockfile.mjs";

test("normalizes both host variants while preserving all other metadata", () => {
  const lock = { lockfileVersion: 3, packages: {
    "node_modules/@scope/local": { version: "1.0.0", integrity: "unchanged", resolved: "http://package-firewall.replit.local/npm/@scope/local/-/local-1.0.0.tgz" },
    "node_modules/internal": { version: "2.0.0", integrity: "also-unchanged", resolved: "https://package-firewall.replit.internal/npm/internal/-/internal-2.0.0.tgz" },
    "node_modules/public": { resolved: "https://registry.npmjs.org/public/-/public-1.0.0.tgz" },
    "node_modules/custom": { resolved: "https://example.org/custom.tgz" },
  }};
  const input = JSON.stringify(lock, null, 2) + "\n";
  const result = normalizeLockfile(input);
  assert.equal(result.count, 2);
  const corrected = JSON.parse(result.text);
  for (const key of Object.keys(lock.packages)) {
    const { resolved: before, ...metadata } = lock.packages[key];
    const { resolved: after, ...newMetadata } = corrected.packages[key];
    assert.deepEqual(newMetadata, metadata);
    assert.equal(after, before.replace(/^https?:\/\/package-firewall\.replit\.(local|internal)\/npm\//, "https://registry.npmjs.org/"));
  }
  assert.deepEqual(normalizeLockfile(result.text), { text: result.text, count: 0 });
});

test("CLI fails in check mode without editing, fixes on request, then passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "portable-lock-test-"));
  const path = join(dir, "package-lock.json");
  const original = '{"packages":{"x":{"resolved":"http://package-firewall.replit.internal/npm/x/-/x-1.tgz"}}}\n';
  const cli = new URL("./portable-lockfile.mjs", import.meta.url);
  const run = (...args) => spawnSync(process.execPath, [cli.pathname, ...args, path], { encoding: "utf8" });
  try {
    writeFileSync(path, original);
    assert.equal(run().status, 1);
    assert.equal(readFileSync(path, "utf8"), original);
    assert.equal(run("--fix").status, 0);
    assert.equal(run().status, 0);
    assert.match(readFileSync(path, "utf8"), /https:\/\/registry.npmjs.org\/x/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("malformed JSON and unrecognized internal paths fail explicitly", () => {
  assert.throws(() => normalizeLockfile("{broken"));
  assert.throws(() => normalizeLockfile('{"resolved":"http://package-firewall.replit.local/unknown/x.tgz"}'), /refusing/);
});
