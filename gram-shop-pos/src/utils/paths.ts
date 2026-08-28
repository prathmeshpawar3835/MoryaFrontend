const BLOCKED_PREFIXES = ['/login', '/forgot-password', '/reset-password']

/** Keep post-login redirects on-site and out of the auth screens. */
export function safeReturnPath(raw: string | null | undefined, fallback = '/dashboard') {
  if (!raw) return fallback
  const path = raw.trim()
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  if (BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`))) {
    return fallback
  }
  return path
}
