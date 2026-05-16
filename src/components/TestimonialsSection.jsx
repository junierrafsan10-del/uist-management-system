import { useEffect, useRef, useState } from 'react'

function useOnScreen(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, visible]
}

const testimonials = [
  {
    name: 'Md. Rakib Hossain',
    course: 'Civil Technology',
    quote: 'After completing my diploma from UIST, I got placed at a reputed construction firm within 2 months. The practical training here is outstanding.',
  },
  {
    name: 'Fatema Begum',
    course: 'Electrical Engineering',
    quote: 'The teachers at UIST are very supportive. I learned things that I directly use at my job every day. Best decision of my life.',
  },
  {
    name: 'Sajib Ahmed',
    course: 'Computer Science and Technology',
    quote: 'The lab facilities and project-based learning helped me build real skills. I now work at a software company in Dhaka.',
  },
]

function TestimonialCard({ item, index, visible }) {
  const [ref, show] = useOnScreen()
  const isVisible = visible && show

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${index * 150}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
        <span className="text-gray-500 font-bold text-lg">{item.name.charAt(0)}</span>
      </div>
      <h4 className="font-bold text-gray-900 text-base">{item.name}</h4>
      <p className="text-ucep-orange text-sm font-medium mb-3">{item.course}</p>
      {/* Stars */}
      <div className="flex gap-0.5 text-amber-400 mb-4 text-lg">★★★★★</div>
      <p className="text-gray-500 text-sm leading-relaxed">{item.quote}</p>
    </div>
  )
}

export default function TestimonialsSection() {
  const [ref, visible] = useOnScreen()

  return (
    <section
      ref={ref}
      className="py-20"
      style={{ background: 'linear-gradient(135deg, #00838F, #004D55)' }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-14">
          Our Success Stories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <TestimonialCard key={i} item={item} index={i} visible={visible} />
          ))}
        </div>
        {/* Mobile carousel hint */}
        <p className="text-white/50 text-center text-sm mt-6 sm:hidden">← Swipe to see more →</p>
      </div>
    </section>
  )
}
