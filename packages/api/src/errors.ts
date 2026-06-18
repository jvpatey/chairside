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
