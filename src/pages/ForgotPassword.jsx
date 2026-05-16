import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00838F] to-[#004D55] p-6 font-body">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
          <polygon points="20,2 38,36 2,36" fill="#F57C00" />
          <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="DM Sans, sans-serif">U</text>
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a reset link.</p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-4 rounded-xl">
            Check your email for the reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00] focus:ring-2 focus:ring-[#F57C00]/20"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#F57C00] text-white font-bold text-sm hover:bg-[#e06d00] transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <Link to="/login" className="block text-center text-sm text-[#F57C00] hover:underline mt-6">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
