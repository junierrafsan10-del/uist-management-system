import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')

  const roleButtons = [
    { key: 'admin', icon: '👨‍💼', label: 'Admin' },
    { key: 'teacher', icon: '👨‍🏫', label: 'Teacher' },
    { key: 'student', icon: '👨‍🎓', label: 'Student' },
  ]

  const handleRoleClick = (role) => {
    setSelectedRole(role)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShake(false)

    if (!email || !password) {
      setError('Please fill in all fields')
      setShake(true)
      return
    }

    setLoading(true)

    const { data, error: authError } = await signIn(email, password)

    if (authError) {
      setLoading(false)
      setError(authError.message === 'Invalid login credentials'
        ? 'Invalid email or password. Please try again.'
        : authError.message)
      setShake(true)
      return
    }

    if (!data?.user) {
      setLoading(false)
      setError('Authentication failed. Please try again.')
      setShake(true)
      return
    }

    setLoading(false)
    setSuccess(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    const role = profile?.role || 'student'
    const paths = { admin: '/admin-dashboard', teacher: '/teacher-dashboard', student: '/student-dashboard' }
    const target = location.state?.from?.pathname || paths[role] || '/student-dashboard'

    setTimeout(() => {
      navigate(target, { replace: true })
    }, 800)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-body">
      <div className="md:w-[45%] bg-gradient-to-br from-[#00838F] to-[#004D55] flex flex-col items-center justify-center p-10 text-white relative overflow-hidden min-h-[300px] md:min-h-screen">
        <div className="absolute -right-[1px] top-0 bottom-0 hidden md:block">
          <svg height="100%" viewBox="0 0 60 1000" preserveAspectRatio="none" style={{ width: 60 }}>
            <path d="M60,0 C20,200 20,400 60,500 C20,600 20,800 60,1000 L0,1000 L0,0 Z" fill="white" />
          </svg>
        </div>

        <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
          <polygon points="20,2 38,36 2,36" fill="white" />
          <text x="20" y="26" textAnchor="middle" fill="#00838F" fontSize="12" fontWeight="bold" fontFamily="DM Sans, sans-serif">U</text>
        </svg>
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-white/80 text-sm mb-8 text-center max-w-xs">UCEP Institute Management System</p>

        <div className="flex gap-6">
          {roleButtons.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => handleRoleClick(r.key)}
              className={`flex flex-col items-center gap-1 transition-transform hover:scale-105 ${selectedRole === r.key ? 'opacity-100' : 'opacity-70'}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm border-2 ${selectedRole === r.key ? 'bg-white/30 border-[#F57C00]' : 'bg-white/15 border-white/20'}`}>
                {r.icon}
              </div>
              <span className={`text-xs ${selectedRole === r.key ? 'text-white font-bold' : 'text-white/70'}`}>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedRole === 'admin' ? 'bg-blue-100 text-blue-700' : selectedRole === 'teacher' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {selectedRole === 'admin' ? '👨‍💼 Admin' : selectedRole === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm mb-6">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@ucep.edu.bd"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00] focus:ring-2 focus:ring-[#F57C00]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00] focus:ring-2 focus:ring-[#F57C00]/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded border-gray-300 text-[#F57C00] focus:ring-[#F57C00]" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-[#F57C00] hover:underline font-medium">Forgot Password?</Link>
            </div>

            {error && (
              <div className={`bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl ${shake ? 'animate-shake' : ''}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 ${success ? 'bg-green-500' : 'bg-gradient-to-r from-[#F57C00] to-[#FF9800] hover:shadow-lg hover:shadow-orange-200'}`}
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              ) : success ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : null}
              {loading ? 'Signing in...' : success ? 'Signed in!' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{' '}
            <span className="text-gray-700 font-medium">Contact Admin</span>
          </p>
        </div>
      </div>
    </div>
  )
}
