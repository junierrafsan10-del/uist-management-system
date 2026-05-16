import { useEffect, useRef, useState } from 'react'

function useOnScreen(threshold = 0.1) {
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

const steps = [
  {
    num: 1,
    icon: '📋',
    title: 'Fill Application',
    desc: 'Download and fill the admission form from our website or collect from campus.',
  },
  {
    num: 2,
    icon: '📄',
    title: 'Submit Documents',
    desc: 'Submit SSC certificate, NID/Birth certificate, 2 passport photos and application fee.',
  },
  {
    num: 3,
    icon: '📞',
    title: 'Admission Test',
    desc: 'Appear for a short written test and interview at our campus.',
  },
  {
    num: 4,
    icon: '✅',
    title: 'Enroll & Start',
    desc: 'Pay fees, collect your student ID and start your journey!',
  },
]

function StepCard({ step, index, visible }) {
  const [ref, show] = useOnScreen()
  const isVisible = visible && show

  return (
    <div
      ref={ref}
      className={`relative flex flex-col items-center text-center p-6 rounded-xl ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F0]'}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 600ms ease-out',
        transitionDelay: `${index * 200}ms`,
      }}
    >
      {/* Numbered circle */}
      <div className="w-[60px] h-[60px] rounded-full bg-ucep-orange flex items-center justify-center mb-4 shrink-0">
        <span className="text-white font-bold text-xl">{step.num}</span>
      </div>
      {/* Icon */}
      <div className="text-3xl mb-2">{step.icon}</div>
      <h4 className="font-bold text-gray-900 text-base mb-2">{step.title}</h4>
      <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
    </div>
  )
}

export default function AdmissionProcess() {
  const [ref, visible] = useOnScreen()

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-ucep-orange inline-block relative pb-3">
            How To Apply
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-ucep-orange rounded-full" />
          </h2>
          <p className="text-gray-500 mt-4 text-lg">Simple 4-step admission process</p>
        </div>

        {/* Desktop timeline */}
        <div className="hidden md:block relative">
          {/* Dashed connecting line */}
          <div
            className="absolute top-[30px] left-[12.5%] right-[12.5%] h-0 border-t-2 border-dashed border-ucep-orange/40"
            style={{ width: '75%', margin: '0 auto' }}
          />
          <div className="grid grid-cols-4 gap-6 relative">
            {steps.map((step, i) => (
              <StepCard key={i} step={step} index={i} visible={visible} />
            ))}
          </div>
        </div>

        {/* Mobile timeline */}
        <div className="md:hidden space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="relative flex gap-4">
              {/* Line connector */}
              {i < steps.length - 1 && (
                <div className="absolute left-[29px] top-[60px] bottom-0 w-0.5 border-l-2 border-dashed border-ucep-orange/40" />
              )}
              {/* Circle */}
              <div className="w-[60px] h-[60px] rounded-full bg-ucep-orange flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xl">{step.num}</span>
              </div>
              {/* Content */}
              <div className={`flex-1 p-4 rounded-xl ${i % 2 === 0 ? 'bg-white' : 'bg-[#FFF8F0]'}`}>
                <div className="text-2xl mb-1">{step.icon}</div>
                <h4 className="font-bold text-gray-900 text-base">{step.title}</h4>
                <p className="text-gray-500 text-sm mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
