import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import express from "express";
import multer from "multer";
import {
  installRequestBodyParsing,
  REQUEST_BODY_LIMIT,
  RFP_IMPORT_BODY_LIMIT,
  requestBodyErrorHandler,
} from "./request-body.js";

function jsonOfSize(size) {
  return JSON.stringify({ description: "x".repeat(size - 18) });
}

// Load only the parser setup from each real entrypoint, avoiding database,
// email, backups and payment side effects. Assert no competing global parser.
for (const entrypoint of ["server/index.ts", "entrypoint.js"]) {
  test(`${entrypoint}: real HTTP parser regression checks`, async (t) => {
    const source = readFileSync(new URL(`../../${entrypoint}`, import.meta.url), "utf8");
    assert.match(source, /import \{ installRequestBodyParsing \} from ['"].*request-body\.js['"]/);
    assert.equal((source.match(/installRequestBodyParsing\(app\);/g) || []).length, 1);
    assert.doesNotMatch(source, /app\.use\(express\.(json|urlencoded)\(/);
    const app = express();
    installRequestBodyParsing(app);
    app.post("/api/rfps", (req, res) => res.json({ size: Buffer.byteLength(JSON.stringify(req.body)) }));
    app.post("/api/admin/rfp-import/preview", (req, res) => res.json({ size: Buffer.byteLength(JSON.stringify(req.body)) }));
    app.post("/upload", multer().single("file"), (req, res) => res.json({ size: req.file.size }));
    app.use((_err, _req, res, _next) => res.status(500).json({ message: "Generic fallback" }));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (body, type = "application/json") => fetch(`${base}/api/rfps`, {
      method: "POST", headers: { "Content-Type": type }, body,
    });
    try {
      for (const size of [151351, REQUEST_BODY_LIMIT]) {
        await t.test(`accepts ${size} byte JSON`, async () => {
          const body = jsonOfSize(size);
          assert.equal(Buffer.byteLength(body), size);
          const response = await post(body);
          assert.equal(response.status, 200);
          assert.equal((await response.json()).size, size);
        });
      }
      await t.test("rejects over-limit JSON with useful 413", async () => {
        const response = await post(jsonOfSize(REQUEST_BODY_LIMIT + 1));
        assert.equal(response.status, 413);
        assert.match((await response.json()).message, /maximum size is 1 MB/);
      });
      await t.test("malformed JSON returns safe 400 without echoing content", async () => {
        const response = await post('{"password":"private-test-value",');
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { message: "Invalid JSON request body." });
      });
      await t.test("URL-encoded requests have the same bounded limit", async () => {
        assert.equal((await post("description=" + "x".repeat(151351), "application/x-www-form-urlencoded")).status, 200);
        assert.equal((await post("description=" + "x".repeat(REQUEST_BODY_LIMIT), "application/x-www-form-urlencoded")).status, 413);
      });
      await t.test("admin import accepts the advertised 10 MB JSON maximum", async () => {
        const response = await fetch(`${base}/api/admin/rfp-import/preview?source=file`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: jsonOfSize(RFP_IMPORT_BODY_LIMIT),
        });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).size, RFP_IMPORT_BODY_LIMIT);
      });
      await t.test("admin import rejects JSON above 10 MB with an accurate 413", async () => {
        const response = await fetch(`${base}/api/admin/rfp-import/preview/`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: jsonOfSize(RFP_IMPORT_BODY_LIMIT + 1),
        });
        assert.equal(response.status, 413);
        assert.match((await response.json()).message, /maximum size is 10 MB/);
      });
      await t.test("large allowance does not apply to neighboring admin routes", async () => {
        const response = await fetch(`${base}/api/admin/rfp-import/preview/other`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: jsonOfSize(REQUEST_BODY_LIMIT + 1),
        });
        assert.equal(response.status, 413);
        assert.match((await response.json()).message, /maximum size is 1 MB/);
      });
      await t.test("multipart file bodies are not constrained by JSON limit", async () => {
        const form = new FormData();
        form.append("file", new Blob(["x".repeat(REQUEST_BODY_LIMIT + 1)]), "document.txt");
        const response = await fetch(`${base}/upload`, { method: "POST", body: form });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).size, REQUEST_BODY_LIMIT + 1);
      });
    } finally {
      await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    }
  });
}

test("unrelated errors pass through unchanged", () => {
  const err = new Error("unrelated failure");
  let forwarded;
  requestBodyErrorHandler(err, {}, {}, (value) => { forwarded = value; });
  assert.equal(forwarded, err);
});
