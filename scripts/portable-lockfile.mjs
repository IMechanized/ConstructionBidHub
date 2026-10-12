import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const internalHosts = new Set([
  "package-firewall.replit.local",
  "package-firewall.replit.internal",
]);

export function normalizeLockfile(text) {
  // Validate first; only alter resolved URLs, never versions or integrity.
  JSON.parse(text);
  let count = 0;
  const normalized = text.replace(/"resolved":\s*"([^"]+)"/g, (field, value) => {
    let url;
    try { url = new URL(value); } catch { return field; }
    if (!internalHosts.has(url.hostname)) return field;
    if (!url.pathname.startsWith("/npm/") || url.username || url.password) {
      throw new Error("Unrecognized internal registry URL; refusing automatic rewrite.");
    }
    count++;
    const publicUrl = `https://registry.npmjs.org/${url.pathname.slice(5)}${url.search}${url.hash}`;
    return field.replace(value, publicUrl);
  });
  return { text: normalized, count };
}

export function main(args) {
  const fix = args.includes("--fix");
  const paths = args.filter((arg) => arg !== "--fix");
  if (paths.length > 1 || paths.some((arg) => arg.startsWith("--"))) {
    throw new Error("Usage: node scripts/portable-lockfile.mjs [--fix] [lockfile]");
  }
  const path = paths[0] || "package-lock.json";
  const result = normalizeLockfile(readFileSync(path, "utf8"));
  if (result.count && !fix) {
    console.error(`Lockfile contains ${result.count} internal package URLs. Run npm run lockfile:fix before committing.`);
    return 1;
  }
  if (result.count) writeFileSync(path, result.text);
  console.log(result.count ? `Normalized ${result.count} internal package URLs.` : "Lockfile package URLs are portable.");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (err) { console.error(err.message); process.exitCode = 1; }
}
