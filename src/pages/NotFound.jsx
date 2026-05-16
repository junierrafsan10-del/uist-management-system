import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#00838F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: 'white', fontSize: '8rem', fontWeight: 800, lineHeight: 1, margin: 0 }}>
        404
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.25rem', margin: '1rem 0 2rem', fontFamily: "'DM Sans', sans-serif" }}>
        Page not found
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#F57C00',
          color: 'white',
          border: 'none',
          padding: '12px 32px',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Back to Home
      </button>
    </div>
  )
}
