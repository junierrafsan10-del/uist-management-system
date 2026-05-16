import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

export default function TiltCard({ children, className = '', limit = 12, shine = true, ...props }) {
  const ref = useRef(null)
  const shineRef = useRef(null)

  const handleMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    el.style.transform = `perspective(1000px) rotateX(${-(y - 0.5) * limit}deg) rotateY(${(x - 0.5) * limit}deg)`
    el.style.transition = 'none'
    if (shine && shineRef.current) {
      shineRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
      shineRef.current.style.opacity = '1'
    }
  }, [limit, shine])

  const handleLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
    el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
    if (shine && shineRef.current) shineRef.current.style.opacity = '0'
  }, [shine])

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative ${className}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      {...props}
    >
      {shine && <div ref={shineRef} className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 transition-opacity duration-300 z-10" style={{ mixBlendMode: 'overlay' }} />}
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  )
}
