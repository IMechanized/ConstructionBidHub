import express from "express";

// RFP descriptions and metadata need more than Express's default 100 KB.
// Binary files use multipart or presigned S3 uploads, not these parsers.
export const REQUEST_BODY_LIMIT = 1024 * 1024;
// The admin import screen explicitly accepts JSON files up to 10 MB.
export const RFP_IMPORT_BODY_LIMIT = 10 * REQUEST_BODY_LIMIT;

export function installRequestBodyParsing(app) {
  const jsonParser = express.json({ limit: REQUEST_BODY_LIMIT });
  const importParser = express.json({ limit: RFP_IMPORT_BODY_LIMIT });
  app.use((req, res, next) => {
    const isImport = req.method === "POST" &&
      req.path.replace(/\/$/, "") === "/api/admin/rfp-import/preview";
    return (isImport ? importParser : jsonParser)(req, res, next);
  });
  app.use(express.urlencoded({ extended: false, limit: REQUEST_BODY_LIMIT }));
  // Handle parser errors before generic handlers can log err.body or turn
  // expected client errors into 500s. Do not log payloads or parser errors.
  app.use(requestBodyErrorHandler);
}

export function requestBodyErrorHandler(err, _req, res, next) {
  if (err?.type === "entity.too.large") {
    const limitMB = err.limit === RFP_IMPORT_BODY_LIMIT ? 10 : 1;
    return res.status(413).json({
      message: `Request body is too large. The maximum size is ${limitMB} MB. Upload files separately.`,
    });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }
  return next(err);
}
