import useScrollAnimation from '../hooks/useScrollAnimation'

const features = [
  {
    title: 'Lab Facilities',
    subtitle: 'Workshops And Other Facilities',
    desc: 'UIST Possesses The Clean, Organized And Wide Laboratories Equipped With Modern Tools And Amenities To Ensure Student\'s Practical Knowledge And Hands-On Experience In Their Respective Fields.',
    gradient: 'linear-gradient(135deg, #FFC107 0%, #E53935 100%)',
  },
  {
    title: 'Library',
    subtitle: 'Books, Notes',
    desc: 'UIST Library Is Located At 2nd Floor, Room #317. A Team Of Responsive Professionals On Library Management Are There To Interact With Students And Provide Necessary Support.',
    gradient: 'linear-gradient(135deg, #FFC107 0%, #E53935 100%)',
  },
  {
    title: 'Online Resources',
    subtitle: 'Virtual Classes',
    desc: 'You Can Study Using Materials And Online Learning Resources That Are Written Or Recommended By Academics From UIST, Ensuring Access To Quality Education From Anywhere.',
    gradient: 'linear-gradient(135deg, #FFC107 0%, #E53935 100%)',
  },
  {
    title: 'Cultural - Sports',
    subtitle: 'Cocurricular Activities',
    desc: 'UIST Cultural Club Promotes Students\' Creativity And Professionalism Through A Cultural Framework By Invigorating The Cultural Diversity And Awareness Among Students.',
    gradient: 'linear-gradient(135deg, #FFC107 0%, #E53935 100%)',
  },
]

function FeatureCard({ feature, index }) {
  const [ref, isVisible] = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={`rounded-xl overflow-hidden transition-all duration-700 ease-out flex flex-col ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        border: '3px solid #FFC107',
        transform: isVisible ? 'rotateY(0deg)' : 'rotateY(90deg)',
        transitionDelay: `${index * 120}ms`,
        transitionProperty: 'opacity, transform, box-shadow',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.03)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div className="flex items-center justify-center" style={{ height: '45%', background: feature.gradient }}>
        <svg className="w-16 h-16 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div className="p-5 text-white flex-1 flex flex-col" style={{ background: 'linear-gradient(180deg, #F57C00, #E53935)' }}>
        <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
        <p className="text-white/80 text-sm mb-2">{feature.subtitle}</p>
        <div className="w-full h-px bg-white/30 mb-3" />
        <p className="text-white/85 text-xs leading-relaxed overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
        }}>{feature.desc}</p>
      </div>
    </div>
  )
}

export default function SpecialFeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-ucep-orange inline-block relative pb-3">
            Special Features
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-ucep-orange rounded-full" />
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
