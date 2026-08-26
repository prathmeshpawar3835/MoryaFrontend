import toast from 'react-hot-toast'

function uniqueMessages(values: string[]) {
  return [...new Set(values.map((s) => s.trim()).filter(Boolean))]
}

export function getApiFieldErrors(error: unknown): string[] {
  if (!error || typeof error !== 'object') return []
  const assigned =
    'apiErrors' in error && Array.isArray((error as { apiErrors?: unknown }).apiErrors)
      ? (error as { apiErrors: unknown[] }).apiErrors.filter((x): x is string => typeof x === 'string')
      : []
  const data = (error as { response?: { data?: { errors?: unknown } } }).response?.data
  const fromBody = Array.isArray(data?.errors)
    ? data.errors.filter((x): x is string => typeof x === 'string')
    : []
  return uniqueMessages([...assigned, ...fromBody])
}

export function getApiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const extras = getApiFieldErrors(error)
  let message = fallback
  if (error && typeof error === 'object') {
    const data = (error as { response?: { data?: { message?: string } }; userMessage?: string }).response?.data
    if (typeof (error as { userMessage?: string }).userMessage === 'string' && (error as { userMessage: string }).userMessage.trim()) {
      message = (error as { userMessage: string }).userMessage
    } else if (data?.message?.trim()) {
      message = data.message
    } else if (error instanceof Error && error.message) {
      message = error.message
    }
  }

  const unique = uniqueMessages([message, ...extras])
  if (unique.length > 1 && unique[0].toLowerCase() === 'validation failed.') {
    return unique.slice(1).join(' ')
  }
  return unique.join(' — ') || fallback
}

export function toastApiError(error: unknown, fallback?: string) {
  toast.error(getApiError(error, fallback))
}
