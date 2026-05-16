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

export default function PrincipalMessage() {
  const [ref, visible] = useOnScreen()

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Left: Photo */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-60px)',
              transition: 'all 800ms ease-out',
            }}
          >
<img
            src="/principal.jpeg"
            alt="Principal"
            className="w-[200px] h-[200px] rounded-full object-cover shrink-0"
            style={{ border: '4px solid #F57C00' }}
          />
          </div>

          {/* Right: Text */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(60px)',
              transition: 'all 800ms ease-out',
            }}
            className="flex-1 text-center md:text-left"
          >
            <span className="text-ucep-orange font-bold text-sm tracking-widest uppercase">Principal's Message</span>
            <div className="relative">
              <span className="absolute -top-6 -left-2 text-orange-200 select-none" style={{ fontSize: '120px', lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</span>
              <p className="text-gray-700 italic leading-relaxed text-lg mt-4 mb-6 md:ml-6">
                UCEP Institute of Science and Technology is committed to producing skilled professionals who contribute to the industrial development of Bangladesh. We believe every student has the potential to excel.
              </p>
            </div>
            <p className="font-bold text-gray-900 text-base">Principal, UIST Dhaka</p>
          </div>
        </div>
      </div>
    </section>
  )
}
