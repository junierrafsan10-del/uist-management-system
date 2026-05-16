import { useRef, useCallback } from 'react'

export default function useTilt(limit = 15) {
  const ref = useRef(null)

  const handleMouse = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(800px) rotateX(${-y * limit}deg) rotateY(${x * limit}deg)`
  }, [limit])

  const handleLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
  }, [])

  return { ref, handleMouse, handleLeave }
}
