import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png'

const GRID = 5
const TOTAL = GRID * GRID

function genPieces() {
  return Array.from({ length: TOTAL }, (_, i) => ({
    id: i,
    row: Math.floor(i / GRID),
    col: i % GRID,
    sx: (Math.random() - 0.5) * 1600,
    sy: (Math.random() - 0.5) * 1200,
    sr: (Math.random() - 0.5) * 720,
    ss: Math.random() * 1.3 + 0.2,
    delay: Math.random() * 0.4,
  }))
}

function genParticles() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (360 / 20) * i + Math.random() * 15,
    color: i % 2 === 0 ? '#3b82f6' : '#f59e0b',
    dist: 80 + Math.random() * 120,
    delay: Math.random() * 0.15,
  }))
}

export default function IntroScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter')
  const [seen, setSeen] = useState(false)
  const skipRef = useRef(false)
  const pieces = useMemo(genPieces, [])
  const particles = useMemo(genParticles, [])

  const done = () => {
    setSeen(true)
    onComplete()
  }

  useEffect(() => {
    if (seen) return
    const t = [
      setTimeout(() => { if (!skipRef.current) setPhase('flash') }, 2800),
      setTimeout(() => { if (!skipRef.current) setPhase('zoom') }, 3800),
      setTimeout(() => { if (!skipRef.current) setPhase('split') }, 4600),
      setTimeout(() => { if (!skipRef.current) done() }, 5400),
    ]
    return () => t.forEach(c => clearTimeout(c))
  }, [seen])

  const skip = () => {
    skipRef.current = true
    setPhase('split')
    setTimeout(done, 800)
  }

  const showPieces = phase === 'enter' || phase === 'flash'

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #000000 70%)' }}>
      {/* Logo+text group */}
      <AnimatePresence>
        {phase !== 'split' && (
          <motion.div
            key="group"
            className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none"
            exit={{ scale: 6, opacity: 0, filter: 'blur(20px)', transition: { duration: 0.8, ease: [0.4, 0, 1, 1] } }}
          >
            <div className="relative flex items-center justify-center">
              {/* Glow ring — CSS animation to avoid framer-motion repeat issues */}
              <div className="absolute rounded-full pointer-events-none" style={{
                width: 360, height: 360,
                border: '2px solid rgba(245,158,11,0.6)',
                boxShadow: '0 0 60px rgba(59,130,246,0.25), 0 0 120px rgba(59,130,246,0.1)',
                animation: phase === 'flash' ? 'pulse-ring 2s ease-in-out infinite' : 'none',
              }} />
              {phase === 'flash' && (
                <motion.div className="absolute rounded-full pointer-events-none"
                  style={{ width: 340, height: 340, border: '3px solid #3b82f6' }}
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              )}
              <div style={{ width: 340, height: 340, borderRadius: '50%', overflow: 'hidden', position: 'relative', backgroundColor: '#fff', border: '3px solid rgba(59,130,246,0.4)' }}>
                {showPieces && (
                  <div className="absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
                    {pieces.map(p => (
                      <motion.div key={p.id} className="absolute"
                        style={{ width: '20%', height: '20%', top: `${p.row * 20}%`, left: `${p.col * 20}%`, backgroundImage: `url(${logo})`, backgroundSize: '500% 500%', backgroundPosition: `${p.col * 25}% ${p.row * 25}%`, overflow: 'hidden' }}
                        initial={{ x: p.sx, y: p.sy, rotate: p.sr, scale: p.ss, opacity: 0 }}
                        animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 80, damping: 14, delay: p.delay + 0.5, duration: 1.2 } }}
                      >
                        <motion.div className="absolute inset-0 bg-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.4, 0] }}
                          transition={{ duration: 0.2, delay: p.delay + 0.55, times: [0, 0.25, 1] }}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              {/* Particle burst */}
              {phase === 'flash' && (
                <div className="absolute pointer-events-none" style={{ zIndex: 5 }}>
                  {particles.map(p => {
                    const rad = (p.angle * Math.PI) / 180
                    return (
                      <motion.div key={p.id} className="absolute rounded-full"
                        style={{ width: 4, height: 4, background: p.color, left: 0, top: 0 }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ x: Math.cos(rad) * p.dist, y: Math.sin(rad) * p.dist, opacity: 0 }}
                        transition={{ duration: 0.5, delay: p.delay, ease: 'easeOut' }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
            {/* Text */}
            {phase !== 'enter' && (
              <motion.div className="text-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', letterSpacing: '4px' }} className="text-white">The Math Mentor</h1>
                <p className="mt-3 flex justify-center gap-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {['UNDERSTAND.', 'PRACTICE.', 'SUCCEED.'].map((w, i) => (
                    <motion.span key={w} className="inline-block text-xs" style={{ color: '#f59e0b', letterSpacing: '4px', fontSize: '0.75rem' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                    >{w}</motion.span>
                  ))}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split panels */}
      {phase === 'split' && (
        <div className="fixed inset-0 pointer-events-none z-50" style={{ perspective: '1000px' }}>
          <motion.div className="absolute left-0 right-0 bg-black"
            initial={{ y: 0 }} animate={{ y: '-100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            style={{ height: '50vh', top: 0, willChange: 'transform' }}
          />
          <motion.div className="absolute left-0 right-0 bg-black"
            initial={{ y: 0 }} animate={{ y: '100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            style={{ height: '50vh', bottom: 0, willChange: 'transform' }}
          />
        </div>
      )}

      {/* Skip */}
      {(phase === 'enter' || phase === 'flash') && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.3 }}
          onClick={skip}
          className="fixed bottom-8 right-8 z-[10000] text-white/60 hover:text-white/90 hover:bg-white/15 transition-all cursor-pointer"
          style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', fontSize: '0.75rem', padding: '6px 16px', borderRadius: '999px', fontFamily: "'DM Sans', sans-serif" }}
        >
          Skip →
        </motion.button>
      )}
    </div>
  )
}
