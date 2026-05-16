import { useState, useEffect, useRef } from 'react'

export default function useCountUp(end, duration = 1000, start = 0) {
  const [value, setValue] = useState(start)
  const raf = useRef(null)

  useEffect(() => {
    const begin = performance.now()
    const step = (now) => {
      const elapsed = now - begin
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + (end - start) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [end, duration, start])

  return value
}
