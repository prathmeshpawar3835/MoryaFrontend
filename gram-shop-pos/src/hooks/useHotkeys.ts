import { useEffect, useRef } from 'react'

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function useHotkeys(map: Record<string, () => void>, enabled = true) {
  const mapRef = useRef(map)
  mapRef.current = map

  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const inField = Boolean(target && INPUT_TAGS.has(target.tagName))
      const key = event.key
      if (key === 'Escape') {
        mapRef.current.Escape?.()
        return
      }
      if (inField && !key.startsWith('F')) return
      const handler = mapRef.current[key]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
