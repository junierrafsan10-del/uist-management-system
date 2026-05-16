import { useNavigate } from 'react-router-dom'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00838F] to-[#004D55] flex flex-col items-center justify-center p-6 text-center font-body">
      <div className="text-6xl mb-6">🔒</div>
      <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
      <p className="text-white/70 text-sm mb-8 max-w-sm">
        You don't have permission to view this page.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl border-2 border-white/50 text-white font-semibold text-sm hover:bg-white/10 transition-all"
        >
          Go Home
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 rounded-xl bg-[#F57C00] text-white font-semibold text-sm hover:bg-[#e06d00] transition-all"
        >
          Login
        </button>
      </div>
    </div>
  )
}
