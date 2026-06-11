import { useState, useEffect, useCallback, useRef } from 'react'
import useAuthStore from '@/store/authStore'

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// ── useLocalStorage ────────────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (err) { console.error(err) }
  }

  return [storedValue, setValue]
}

// ── useClickOutside ────────────────────────────────────────────────────────────
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

// ── useIntersectionObserver ────────────────────────────────────────────────────
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, isIntersecting]
}

// ── usePagination ──────────────────────────────────────────────────────────────
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  const nextPage = useCallback(() => setPage(p => p + 1), [])
  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), [])
  const goToPage = useCallback((p) => setPage(p), [])
  const reset = useCallback(() => setPage(1), [])

  return { page, limit, setPage, nextPage, prevPage, goToPage, reset }
}

// ── useWindowSize ──────────────────────────────────────────────────────────────
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return size
}

// ── useSocket ─────────────────────────────────────────────────────────────────
export function useSocket() {
  const socketRef = useRef(null)
  const { accessToken } = useAuthStore()   

  useEffect(() => {
    if (!accessToken || socketRef.current) return
    import('socket.io-client').then(({ io }) => {
      socketRef.current = io(
        import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
        { auth: { token: accessToken }, transports: ['websocket'] }
      )
    })
    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [accessToken])

  return socketRef
}