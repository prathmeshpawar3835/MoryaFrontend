export function getApiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error && typeof error === 'object' && 'userMessage' in error && typeof error.userMessage === 'string') {
    return error.userMessage
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function getApiFieldErrors(error: unknown): string[] {
  if (error && typeof error === 'object' && 'apiErrors' in error && Array.isArray(error.apiErrors)) {
    return error.apiErrors.filter((x): x is string => typeof x === 'string')
  }
  return []
}
