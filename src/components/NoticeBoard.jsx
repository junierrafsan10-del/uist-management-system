import { useEffect, useRef, useState } from 'react'
import { useNotices } from '../hooks/useData'

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

const categoryColors = {
  Urgent: '#E53935',
  Admission: '#00ACC1',
  Exam: '#F57C00',
  Academic: '#43A047',
  Event: '#9C27B0',
}

const defaultColor = '#00838F'

function getNoticeColor(category) {
  return categoryColors[category] || defaultColor
}

function NoticeCard({ notice, index, visible }) {
  const [ref, show] = useOnScreen()
  const isVisible = visible && show
  const color = getNoticeColor(notice.category)

  return (
    <div
      ref={ref}
      className="bg-white rounded-xl p-5 relative overflow-hidden transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${index * 150}ms`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <span
        className="absolute top-3 right-3 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
        style={{ background: color }}
      >
        {notice.category}
      </span>
      <h4 className="font-bold text-gray-900 text-sm pr-24 mb-1">{notice.title}</h4>
      <p className="text-gray-400 text-xs mb-2">{notice.date}</p>
      <p className="text-gray-500 text-sm leading-relaxed">
        {notice.body.length > 80 ? notice.body.slice(0, 80) + '...' : notice.body}
      </p>
    </div>
  )
}

export default function NoticeBoard() {
  const [ref, visible] = useOnScreen()
  const { data: notices, loading } = useNotices(true)

  if (loading) return null

  return (
    <section ref={ref} className="py-20" style={{ background: '#F5F5F5' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-ucep-orange inline-block relative pb-3">
            Latest Notices
            <span className="absolute bottom-0 left-0 w-20 h-1 bg-ucep-orange rounded-full" />
          </h2>
          <a href="#" className="text-ucep-orange font-semibold text-sm hover:underline hidden sm:block">
            View All &rarr;
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {notices.map((notice, i) => (
            <NoticeCard key={notice.id} notice={notice} index={i} visible={visible} />
          ))}
        </div>

        <a href="#" className="text-ucep-orange font-semibold text-sm hover:underline mt-5 text-center block sm:hidden">
          View All &rarr;
        </a>
      </div>
    </section>
  )
}
