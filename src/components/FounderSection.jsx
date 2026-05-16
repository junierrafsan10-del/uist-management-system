import useScrollAnimation from '../hooks/useScrollAnimation'

export default function FounderSection() {
  const [ref, isVisible] = useScrollAnimation()

  return (
    <section ref={ref} className="py-20" style={{ background: '#2a2a2a' }}>
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div
          className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <div
            className="w-20 h-20 mx-auto rounded-full bg-cover bg-center mb-4"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face)',
              border: '3px solid #F57C00'
            }}
          />
        </div>
        <h3
          className={`text-2xl font-bold text-ucep-orange mb-3 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '300ms' }}
        >
          Lindsay Allan Cheyne, The Founder
        </h3>
        <p
          className={`text-gray-300 leading-relaxed max-w-2xl mx-auto transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '450ms' }}
        >
          Lindsay Allan Cheyne was a Scottish missionary and educator who founded UCEP in 1972. His vision was to provide
          technical and vocational education to underprivileged children in Bangladesh, empowering them with skills for a
          better future. His legacy continues through UCEP Institute of Science and Technology.
        </p>
      </div>
    </section>
  )
}
