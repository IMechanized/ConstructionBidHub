import type { Express, ErrorRequestHandler } from "express";

export const REQUEST_BODY_LIMIT: number;
export const RFP_IMPORT_BODY_LIMIT: number;
export function installRequestBodyParsing(app: Express): void;
export const requestBodyErrorHandler: ErrorRequestHandler;
