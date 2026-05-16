import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import ucepLogo from '../assets/UCEP-logo.png'

const adminNavItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin-dashboard', icon: '🏠' },
  { key: 'students', label: 'Students', path: '/admin/students', icon: '👨‍🎓' },
  { key: 'teachers', label: 'Teachers', path: '/admin-dashboard?tab=teachers', icon: '👨‍🏫' },
  { key: 'courses', label: 'Courses', path: '/admin-dashboard?tab=courses', icon: '📚' },
  { key: 'notices', label: 'Notices', path: '/admin-dashboard?tab=notices', icon: '📋' },
  { key: 'results', label: 'Results', path: '/admin/results', icon: '📊' },
  { key: 'attendance', label: 'Attendance', path: '/admin/attendance', icon: '✅' },
  { key: 'placements', label: 'Job Placement', path: '/admin-dashboard?tab=placements', icon: '💼' },
  { key: 'documents', label: 'Documents', path: '/admin-dashboard?tab=documents', icon: '📁' },
  { key: 'settings', label: 'Settings', path: '/admin-dashboard?tab=settings', icon: '⚙️' },
]

const studentNavItems = [
  { key: 'dashboard', label: 'My Dashboard', path: '/student-dashboard', icon: '🏠' },
  { key: 'results', label: 'My Results', path: '/student-dashboard?tab=results', icon: '📊' },
  { key: 'attendance', label: 'My Attendance', path: '/student-dashboard?tab=attendance', icon: '✅' },
  { key: 'notices', label: 'Notices', path: '/student-dashboard?tab=notices', icon: '📋' },
  { key: 'profile', label: 'My Profile', path: '/student-dashboard?tab=profile', icon: '👤' },
  { key: 'password', label: 'Change Password', path: '/student-dashboard?tab=password', icon: '🔒' },
]

const teacherNavItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/teacher-dashboard', icon: '🏠' },
  { key: 'attendance', label: 'Mark Attendance', path: '/teacher-dashboard?tab=attendance', icon: '✅' },
  { key: 'results', label: 'Enter Results', path: '/teacher-dashboard?tab=results', icon: '📊' },
  { key: 'notices', label: 'Post Notice', path: '/teacher-dashboard?tab=notices', icon: '📋' },
  { key: 'students', label: 'My Students', path: '/teacher-dashboard?tab=students', icon: '👨‍🎓' },
  { key: 'profile', label: 'My Profile', path: '/teacher-dashboard?tab=profile', icon: '👤' },
]

export default function DashboardLayout({ children, activeTab, setActiveTab, role = 'admin' }) {
  const navItems = role === 'student' ? studentNavItems : role === 'teacher' ? teacherNavItems : adminNavItems
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = location.pathname + location.search
  const currentTab = activeTab || navItems.find(n => n.path === currentPath)?.key || navItems.find(n => n.path === location.pathname)?.key || navItems[0]?.key || 'dashboard'

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleLogout = () => {
    signOut()
    navigate('/')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const adminName = profile?.name || user?.email?.split('@')[0] || 'Admin'
  const notificationCount = 3

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex font-body">
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (sidebarOpen ? 0 : -280) : 0,
          width: 260
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col shadow-xl ${isMobile ? 'shadow-2xl' : ''}`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src={ucepLogo} alt="UCEP" className="w-10 h-10 rounded-lg object-contain bg-white" />
            <div>
              <p className="font-bold text-[#0f2040] text-sm leading-tight">UCEP</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item, i) => {
            const isActive = currentTab === item.key
            return (
              <motion.div key={item.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Link
                  to={item.path}
                  onClick={() => { if (isMobile) setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-[#FFC107]/10 text-[#0f2040]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="adminNav"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFC107] rounded-r"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0f2040] rounded-full flex items-center justify-center text-white font-bold text-sm">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{adminName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Logout
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
            <h2 className="font-semibold text-gray-800 text-lg capitalize">{navItems.find(n => n.key === activeTab)?.label || 'Dashboard'}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-700">{getGreeting()}, {adminName}</p>
              <p className="text-xs text-gray-500">{getCurrentDate()}</p>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <div className="w-9 h-9 bg-[#0f2040] rounded-full flex items-center justify-center text-white font-bold text-sm">
                {adminName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}