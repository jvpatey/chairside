export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as { message?: unknown; details?: unknown; hint?: unknown };
    const parts = [record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .map((part) => part.trim());
    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return fallback;
}

export function throwWithMessage(error: unknown, fallback: string): never {
  throw new Error(getErrorMessage(error, fallback));
}

export function getFunctionsHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('context' in error)) {
    return null;
  }

  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== 'object' || !('status' in context)) {
    return null;
  }

  const status = (context as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

export async function resolveFunctionErrorMessage(
  error: unknown,
  data: unknown,
): Promise<string | null> {
  if (data && typeof data === 'object' && data !== null && 'error' in data) {
    const payloadError = (data as { error?: unknown }).error;
    if (typeof payloadError === 'string' && payloadError.trim()) {
      return payloadError.trim();
    }
  }

  const context =
    error && typeof error === 'object' && error !== null && 'context' in error
      ? (error as { context?: unknown }).context
      : null;

  if (context && typeof context === 'object' && context !== null && 'json' in context) {
    try {
      const body = await (context as Response).json();
      if (body && typeof body.error === 'string' && body.error.trim()) {
        return body.error.trim();
      }
    } catch {
      // Fall through to the generic invoke message.
    }
  }

  return null;
}
