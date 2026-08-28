export function apiOrigin() {
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5088/api').replace(/\/api\/?$/, '')
}

export function productImageSrc(path?: string | null, imageUrl?: string | null) {
  const value = path || imageUrl || '/images/default-jewellery.svg'
  if (value.startsWith('http') || value.startsWith('/images/')) return value
  const origin = apiOrigin()
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`
}
