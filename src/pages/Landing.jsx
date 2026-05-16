import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AchievementsSection from '../components/AchievementsSection'
import FounderSection from '../components/FounderSection'
import PrincipalMessage from '../components/PrincipalMessage'
import SpecialFeaturesSection from '../components/SpecialFeaturesSection'
import TestimonialsSection from '../components/TestimonialsSection'
import AdmissionProcess from '../components/AdmissionProcess'
import NoticeBoard from '../components/NoticeBoard'
import GalleryStrip from '../components/GalleryStrip'
import FooterSection from '../components/Footer'
import HeroSection from '../components/HeroSection'
import ucepLogo from '../assets/UCEP-logo.png'

const courses = [
  { name: 'Civil Technology', dept: 'Civil', img: '/civil.jpeg' },
  { name: 'Mechanical Engineering', dept: 'Mechanical', img: '/mechanical.jpeg' },
  { name: 'Electrical Engineering', dept: 'Electrical', img: '/electrical.jpeg' },
  { name: 'Textile Engineering', dept: 'Textile', img: '/textile.jpeg' },
  { name: 'Computer Science and Technology', dept: 'CST', img: '/computer-science.jpeg' },
  { name: 'Automobile Engineering', dept: 'Auto', img: '/automobile.jpeg' },
]

const navLinks = [
  { label: 'Home', href: '#', hasDropdown: false },
  { label: 'About Us', href: '#', hasDropdown: true },
  { label: 'Academic', href: '#', hasDropdown: true },
  { label: 'Admission', href: '#', hasDropdown: true },
  { label: 'Job Placement', href: '#', hasDropdown: true },
  { label: 'Notice', href: '#', hasDropdown: false },
  { label: '4.0 IR', href: '#', hasDropdown: false },
  { label: 'Contact Us', href: '#', hasDropdown: false },
]

function CourseCard({ course, index }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0, rootMargin: '0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`course-card-3d rounded-xl overflow-hidden bg-white shadow-lg ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: visible ? `${index * 0.06}s` : '0s' }}
    >
      <div className="h-[180px] flex items-center justify-center overflow-hidden">
        <img src={course.img} alt={course.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center justify-center" style={{ height: '120px' }}>
        <h3 className="text-ucep-orange font-bold text-lg text-center px-4">{course.name}</h3>
      </div>
    </div>
  )
}

function Navbar() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileDropdown, setMobileDropdown] = useState(null)
  const [activeLink, setActiveLink] = useState('Home')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMobile = () => { setMobileOpen(false); setMobileDropdown(null) }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top bar */}
        <div className="bg-ucep-teal text-white text-sm">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center h-10">
            <span className="text-xs sm:text-sm font-medium">
              Welcome to UCEP Institute of Science and Technology
            </span>
          </div>
        </div>

        {/* Main navbar */}
        <nav className={`bg-white transition-all duration-300 ${scrolled ? 'navbar-scrolled' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 shrink-0">
              <img src={ucepLogo} alt="UCEP Logo" className="w-10 h-10 object-contain" loading="lazy" decoding="async" />
              <div className="leading-tight">
                <div className="font-bold text-gray-800 text-sm">UCEP</div>
                <div className="text-[10px] text-gray-500 leading-tight max-w-[140px]">
                  INSTITUTE OF SCIENCE AND TECHNOLOGY DHAKA
                </div>
              </div>
            </a>

            {/* Nav links - desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.label} className="relative dropdown-trigger">
                  <a
                    href={link.href}
                    onClick={() => setActiveLink(link.label)}
                    className={`px-3 py-2 text-xs font-bold tracking-wide flex items-center gap-1 relative ${activeLink === link.label ? 'text-ucep-orange' : 'text-gray-700 hover:text-ucep-orange'}`}
                  >
                    {link.label}
                    {activeLink === link.label && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-ucep-orange rounded-full" />
                    )}
                    {link.hasDropdown && (
                      <svg className="w-3 h-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </a>
                  {link.hasDropdown && (
                    <div className="dropdown-menu absolute top-full left-0 min-w-[200px] py-3 z-50">
                      <a href="#" className="block px-5 py-2.5 text-sm text-gray-600 hover:text-ucep-orange hover:bg-orange-50 transition-colors">Sub Menu 1</a>
                      <a href="#" className="block px-5 py-2.5 text-sm text-gray-600 hover:text-ucep-orange hover:bg-orange-50 transition-colors">Sub Menu 2</a>
                      <a href="#" className="block px-5 py-2.5 text-sm text-gray-600 hover:text-ucep-orange hover:bg-orange-50 transition-colors">Sub Menu 3</a>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => navigate('/login')} className="ml-2 bg-ucep-darkteal text-white text-xs font-semibold px-5 py-2 rounded-full hover:bg-opacity-90 transition-all">
                Student Portal
              </button>
              <button onClick={() => navigate('/login')} className="bg-ucep-orange text-white text-xs font-semibold px-5 py-2 rounded-full hover:bg-opacity-90 transition-all">
                Admin Portal
              </button>
              <button className="p-2 text-ucep-orange hover:text-orange-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-ucep-orange">
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-[70] lg:hidden transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible'}`}
        onClick={closeMobile}
      >
        <div className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'rgba(0,0,0,0.4)' }} />
        <div
          className={`absolute top-0 right-0 w-72 h-full bg-white shadow-xl overflow-y-auto transition-all duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">Menu</span>
            <button onClick={closeMobile} className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-1">
            {navLinks.map(link => (
              <div key={link.label}>
                {link.hasDropdown ? (
                  <>
                    <button
                      onClick={() => setMobileDropdown(mobileDropdown === link.label ? null : link.label)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-ucep-orange hover:bg-orange-50 rounded-lg"
                    >
                      {link.label}
                      <svg className={`w-3 h-3 transition-transform duration-200 ${mobileDropdown === link.label ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${mobileDropdown === link.label ? 'max-h-40' : 'max-h-0'}`}>
                      <div className="pl-4 py-1 space-y-1">
                        <a href="#" onClick={closeMobile} className="block px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-ucep-orange rounded-lg">Sub Menu 1</a>
                        <a href="#" onClick={closeMobile} className="block px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-ucep-orange rounded-lg">Sub Menu 2</a>
                        <a href="#" onClick={closeMobile} className="block px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-ucep-orange rounded-lg">Sub Menu 3</a>
                      </div>
                    </div>
                  </>
                ) : (
                  <a key={link.label} href={link.href} onClick={() => { setActiveLink(link.label); closeMobile() }} className="block px-4 py-3 text-sm font-bold text-gray-700 hover:text-ucep-orange hover:bg-orange-50 rounded-lg">
                    {link.label}
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-3">
            <button onClick={() => { navigate('/login'); closeMobile() }} className="w-full py-3 bg-ucep-darkteal text-white text-sm font-semibold rounded-full">
              Student Portal
            </button>
            <button onClick={() => { navigate('/login'); closeMobile() }} className="w-full py-3 bg-ucep-orange text-white text-sm font-semibold rounded-full">
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function CoursesSection() {
  return (
    <section id="courses" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-ucep-orange inline-block relative pb-3">
            Our Courses
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-ucep-orange rounded-full" />
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {courses.map((course, i) => (
            <CourseCard key={course.dept} course={course} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-body">
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="h-[104px]" />

      <HeroSection />
      <CoursesSection />
      <AchievementsSection />
      <FounderSection />
      <PrincipalMessage />
      <SpecialFeaturesSection />
      <TestimonialsSection />
      <AdmissionProcess />
      <NoticeBoard />
      <GalleryStrip />
      <FooterSection />
    </div>
  )
}
