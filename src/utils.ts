import { Handler } from 'express';

export class UserError extends Error {}

export function asyncHandler(handler: Handler): Handler {
  return async function middleware(req, res, next): Promise<void> {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
