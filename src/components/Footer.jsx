import useScrollAnimation from '../hooks/useScrollAnimation'

function FooterColumn({ children, className = '' }) {
  const [ref, isVisible] = useScrollAnimation()
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  )
}

export default function Footer() {
  return (
    <footer style={{ background: '#2E6B73' }}>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1 — Important Links */}
          <FooterColumn className="-translate-x-8">
            <h3 className="text-white font-bold text-lg mb-5" style={{ borderLeft: '3px solid #F57C00', paddingLeft: '12px' }}>
              Important Links
            </h3>
            <ul className="space-y-3">
              {['BTEB', 'Ministry of Education', 'Education Board Bangladesh', 'Government of Bangladesh', 'UCEP Bangladesh'].map(link => (
                <li key={link}>
                  <a href="#" className="text-white/80 hover:text-[#FFC107] text-sm flex items-center gap-2 transition-colors duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Column 2 — Quick Links */}
          <FooterColumn className="-translate-x-8" style={{ transitionDelay: '150ms' }}>
            <h3 className="text-white font-bold text-lg mb-5" style={{ borderLeft: '3px solid #F57C00', paddingLeft: '12px' }}>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {['Admission', 'Requirements and Procedures', 'Results', 'Notices', 'Newsletter'].map(link => (
                <li key={link}>
                  <a href="#" className="text-white/80 hover:text-[#FFC107] text-sm flex items-center gap-2 transition-colors duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Column 3 — Contact Info */}
          <FooterColumn className="translate-x-8" style={{ transitionDelay: '300ms' }}>
            <h3 className="text-white font-bold text-lg mb-5" style={{ borderLeft: '3px solid #F57C00', paddingLeft: '12px' }}>
              Contact Info
            </h3>
            <div className="text-white/80 text-sm space-y-3 leading-relaxed">
              <p>Plot# 2 & 3, Mirpur-2, Dhaka-1216</p>
              <p>Phone: +88-02-9036034</p>
              <p>Mobile: +88-01515 11 22 33</p>
              <p>Email: principal.uist.dhaka@ucepbd.org</p>
            </div>
            <a
              href="#"
              className="inline-block mt-4 bg-ucep-teal text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all"
            >
              WHATSAPP
            </a>
          </FooterColumn>

          {/* Column 4 — Follow Us + Recent Posts */}
          <FooterColumn className="translate-x-8" style={{ transitionDelay: '450ms' }}>
            <h3 className="text-white font-bold text-lg mb-5" style={{ borderLeft: '3px solid #F57C00', paddingLeft: '12px' }}>
              Follow Us
            </h3>
            <div className="flex gap-3 mb-8">
              {[
                { label: 'X', color: '#1da1f2' },
                { label: 'f', color: '#1877f2' },
                { label: 'in', color: '#0a66c2' },
                { label: 'ig', color: '#e4405f' },
                { label: 'yt', color: '#ff0000' },
              ].map(social => (
                <a
                  key={social.label}
                  href="#"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
                  style={{ background: '#1f5359' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F57C00'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1f5359'}
                  title={social.label}
                >
                  {social.label}
                </a>
              ))}
            </div>

            <h4 className="text-white font-semibold text-sm mb-4">Recent Posts</h4>
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded bg-gray-500/30 shrink-0" />
              <div>
                <p className="text-white/80 text-xs leading-snug mb-1">
                  উইস্ট এ ভর্তি চলছে / Admission Going On
                </p>
                <span className="text-white/50 text-[10px]">December 12, 2024</span>
              </div>
            </div>
          </FooterColumn>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: '#1f5359' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-white/60 text-xs">
          &copy; 2024 UCEP Institute of Science and Technology | All Rights Reserved
        </div>
      </div>
    </footer>
  )
}
