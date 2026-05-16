const items = [
  { label: 'Lab Session', img: '/campus1.jpg' },
  { label: 'Graduation Day', img: '/campus2.jpg' },
  { label: 'Industrial Visit', img: '/campus3.jpg' },
  { label: 'Sports Day', img: '/campus4.jpg' },
  { label: 'Cultural Program', img: '/campus5.jpg' },
  { label: 'Lab Session', img: '/campus1.jpg' },
  { label: 'Graduation Day', img: '/campus2.jpg' },
  { label: 'Industrial Visit', img: '/campus3.jpg' },
]

export default function GalleryStrip() {
  return (
    <section style={{ background: '#1a1a1a' }} className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center">
          Campus Life
        </h2>
      </div>

      <div className="gallery-track-wrapper">
        <div className="gallery-track">
          {[...items, ...items].map((item, i) => (
            <div
              key={i}
              className="gallery-card"
              style={{ background: `url(${item.img}) center/cover no-repeat` }}
            >
              <div className="gallery-card-overlay" />
              <span className="gallery-card-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
