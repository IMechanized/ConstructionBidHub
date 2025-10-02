/**
 * Route parameter validation utilities using Zod
 * Prevents injection attacks and ensures type safety for route parameters
 */

import { z } from 'zod';
import { Request, Response } from 'express';
import { sendErrorResponse, ErrorMessages } from './error-handler.js';

/**
 * Schema for validating positive integer IDs
 */
export const positiveIntSchema = z.string()
  .regex(/^\d+$/, 'Must be a positive integer')
  .transform(Number)
  .refine(n => n > 0 && Number.isInteger(n), {
    message: 'Must be a positive integer'
  });

/**
 * Schema for validating UUID format
 */
export const uuidSchema = z.string()
  .uuid('Must be a valid UUID');

/**
 * Schema for validating alphanumeric strings (for slugs, etc.)
 */
export const alphanumericSchema = z.string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Must contain only letters, numbers, hyphens, and underscores')
  .min(1)
  .max(255);

/**
 * Validate and extract a positive integer ID from route params
 * Returns null and sends error response if validation fails
 */
export function validatePositiveInt(
  paramValue: string | undefined,
  paramName: string,
  res: Response
): number | null {
  try {
    if (!paramValue) {
      sendErrorResponse(
        res,
        new Error(`Missing ${paramName}`),
        400,
        ErrorMessages.BAD_REQUEST,
        'ParamValidation'
      );
      return null;
    }

    const result = positiveIntSchema.safeParse(paramValue);
    
    if (!result.success) {
      sendErrorResponse(
        res,
        new Error(`Invalid ${paramName}`),
        400,
        ErrorMessages.BAD_REQUEST,
        'ParamValidation'
      );
      return null;
    }

    return result.data;
  } catch (error) {
    sendErrorResponse(
      res,
      error instanceof Error ? error : new Error('Validation error'),
      400,
      ErrorMessages.BAD_REQUEST,
      'ParamValidation'
    );
    return null;
  }
}

/**
 * Validate multiple route params at once
 * Returns null and sends error response if any validation fails
 */
export function validateRouteParams(
  req: Request,
  res: Response,
  params: Record<string, 'positiveInt' | 'alphanumeric' | 'uuid'>
): Record<string, number | string> | null {
  const validated: Record<string, number | string> = {};

  for (const [paramName, type] of Object.entries(params)) {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      sendErrorResponse(
        res,
        new Error(`Missing ${paramName}`),
        400,
        ErrorMessages.BAD_REQUEST,
        'ParamValidation'
      );
      return null;
    }

    try {
      let schema: z.ZodSchema;
      
      switch (type) {
        case 'positiveInt':
          schema = positiveIntSchema;
          break;
        case 'alphanumeric':
          schema = alphanumericSchema;
          break;
        case 'uuid':
          schema = uuidSchema;
          break;
        default:
          throw new Error(`Unknown validation type: ${type}`);
      }

      const result = schema.safeParse(paramValue);
      
      if (!result.success) {
        sendErrorResponse(
          res,
          new Error(`Invalid ${paramName}`),
          400,
          ErrorMessages.BAD_REQUEST,
          'ParamValidation'
        );
        return null;
      }

      validated[paramName] = result.data;
    } catch (error) {
      sendErrorResponse(
        res,
        error instanceof Error ? error : new Error('Validation error'),
        400,
        ErrorMessages.BAD_REQUEST,
        'ParamValidation'
      );
      return null;
    }
  }

  return validated;
}

/**
 * Validate query parameters using a Zod schema
 * Returns null and sends error response if validation fails
 */
export function validateQueryParams<T>(
  req: Request,
  res: Response,
  schema: z.ZodSchema<T>
): T | null {
  try {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      sendErrorResponse(
        res,
        new Error('Invalid query parameters'),
        400,
        ErrorMessages.BAD_REQUEST,
        'QueryValidation'
      );
      return null;
    }

    return result.data;
  } catch (error) {
    sendErrorResponse(
      res,
      error instanceof Error ? error : new Error('Validation error'),
      400,
      ErrorMessages.BAD_REQUEST,
      'QueryValidation'
    );
    return null;
  }
}
