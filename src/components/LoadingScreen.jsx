import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#00ACC1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.5s ease',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,2 38,36 2,36" fill="white" />
        <text x="20" y="26" textAnchor="middle" fill="#00ACC1" fontSize="12" fontWeight="bold" fontFamily="DM Sans, sans-serif">U</text>
      </svg>
      <p style={{ color: 'white', fontFamily: "'DM Sans', sans-serif", fontSize: '1.25rem', fontWeight: 600, marginTop: '1rem' }}>
        UCEP Institute of Science and Technology
      </p>
      <div
        style={{
          marginTop: '1.5rem',
          width: '160px',
          height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#F57C00',
            borderRadius: '2px',
            animation: 'loading-bar 1.5s ease-in-out forwards',
          }}
        />
      </div>
    </div>
  )
}
