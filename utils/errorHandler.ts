import { logger } from './logger';

/**
 * Error handling strategies enum
 */
export enum ErrorStrategy {
  THROW = 'throw',        // Re-throw the error after logging
  RETURN_FALSE = 'return_false',  // Log and return false (for validation functions)
  RETURN_NULL = 'return_null',    // Log and return null
  SILENT = 'silent'       // Log only, don't throw (use sparingly)
}

/**
 * Consistent error handler for the entire application
 * @param error - The error that occurred
 * @param context - Description of where/what operation failed
 * @param strategy - How to handle the error after logging
 */
export function handleError(
  error: unknown,
  context: string,
  strategy: ErrorStrategy = ErrorStrategy.THROW
): never | boolean | null {
  // Ensure we have a proper Error object
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Log the error with context
  logger.error(`${context}:`, errorObj);

  // Handle based on strategy
  switch (strategy) {
    case ErrorStrategy.THROW:
      throw errorObj;

    case ErrorStrategy.RETURN_FALSE:
      return false;

    case ErrorStrategy.RETURN_NULL:
      return null;

    case ErrorStrategy.SILENT:
      return null;

    default:
      throw errorObj;
  }
}

/**
 * Specialized error handler for mathematical expression evaluation
 * Returns false on error, which is appropriate for validation functions
 */
export function handleMathError(error: unknown, operation: string): boolean {
  return handleError(error, `Math operation failed (${operation})`, ErrorStrategy.RETURN_FALSE) as boolean;
}

/**
 * Specialized error handler for database operations
 * Throws the error after logging, as database failures should be fatal
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  return handleError(error, `Database operation failed (${operation})`, ErrorStrategy.THROW) as never;
}

/**
 * Specialized error handler for validation operations
 * Returns false on error, allowing validation to continue
 */
export function handleValidationError(error: unknown, validation: string): boolean {
  return handleError(error, `Validation failed (${validation})`, ErrorStrategy.RETURN_FALSE) as boolean;
}

/**
 * Wrapper for async operations that might fail
 * Automatically handles errors and applies the specified strategy
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string,
  strategy: ErrorStrategy = ErrorStrategy.THROW
): Promise<T | boolean | null> {
  try {
    return await operation();
  } catch (error) {
    return handleError(error, context, strategy);
  }
}

/**
 * Wrapper for sync operations that might fail
 * Automatically handles errors and applies the specified strategy
 */
export function safeSync<T>(
  operation: () => T,
  context: string,
  strategy: ErrorStrategy = ErrorStrategy.THROW
): T | boolean | null {
  try {
    return operation();
  } catch (error) {
    return handleError(error, context, strategy);
  }
}
