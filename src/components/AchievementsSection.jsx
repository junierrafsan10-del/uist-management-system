import { useEffect, useState } from 'react'
import useScrollAnimation from '../hooks/useScrollAnimation'

const stats = [
  { value: 1000, suffix: '+', label: 'CURRENT STUDENTS', desc: 'Currently We Have More Than 1000 Meritarious Students.' },
  { value: 6, suffix: '', label: 'TECHNOLOGIES', desc: 'We Have Six Technologies Which Are Most In High Demand In The Job Sector.' },
  { value: 100, suffix: '%', label: 'JOB SUCCESS RATE', desc: 'We Have Job Placement Cell, Through Which Students Are Placed In Various Reputed Industries.' },
  { value: 300, suffix: '+', label: 'FACTORY-INDUSTRY', desc: 'We Have More Than 300 Industrial Linkages With Our Institution, Through Which Students Are Provided With Jobs.' },
]

function CountUp({ end, suffix, duration = 2000, started }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!started) return
    let startTime = null
    let raf

    function step(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, duration, started])

  return <>{count}{suffix}</>
}

function StatColumn({ stat, index, started }) {
  const [ref, visible] = useScrollAnimation()
  const show = started && visible

  return (
    <div
      ref={ref}
      className={`text-center px-4 transition-all duration-700 ease-out relative ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {index > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/30 hidden lg:block" />
      )}
      <div className="font-bold text-white mb-1" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)' }}>
        <CountUp end={stat.value} suffix={stat.suffix} started={show} />
      </div>
      <div className="w-16 h-0.5 bg-orange-400 mx-auto mb-1" />
      <div className="text-orange-400 font-bold text-sm tracking-widest mb-3">{stat.label}</div>
      <p className="text-white/70 text-sm max-w-[220px] mx-auto leading-relaxed">{stat.desc}</p>
    </div>
  )
}

export default function AchievementsSection() {
  const [sectionRef, started] = useScrollAnimation()

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-cover bg-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,50,55,0.75), rgba(0,50,55,0.75)), url(https://images.unsplash.com/photo-1562774053-701939374585?w=1200)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16 tracking-wider">
          ACHIEVEMENTS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((stat, i) => (
            <StatColumn key={stat.label} stat={stat} index={i} started={started} />
          ))}
        </div>
      </div>
    </section>
  )
}
