/**
 * Type safety utilities to eliminate unsafe return errors
 */

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Safely cast JSON data with fallback
 */
export function safeJsonCast<T>(data: unknown, fallback: T): T {
  if (data === null || data === undefined) {
    return fallback;
  }
  return data as T;
}

/**
 * Safely access object property with fallback
 */
export function safePropertyAccess<T>(
  obj: Record<string, T>,
  key: string,
  fallback: T,
): T {
  return obj[key] ?? fallback;
}

/**
 * Type guard for checking if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Create error result with safe message
 */
export function createErrorResult(
  error: unknown,
  context?: string,
): {
  success: false;
  message: string;
} {
  const baseMessage = getErrorMessage(error);
  const fullMessage = context ? `${context}: ${baseMessage}` : baseMessage;

  return {
    success: false,
    message: fullMessage,
  };
}
