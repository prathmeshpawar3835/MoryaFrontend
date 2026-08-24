export function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      out[key] = value
    }
  }
  return out
}
