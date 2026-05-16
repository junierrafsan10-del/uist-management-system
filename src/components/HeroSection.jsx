import { useEffect, useState } from 'react'
import studentPhoto from '../assets/hero-students.jpg'

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#003d45',
    }}>
      {/* LAYER 1: The actual photo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${studentPhoto})`,
        backgroundSize: 'cover',
        backgroundPosition: '50% 65%',
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.55) saturate(0.8)',
        transform: 'scale(1.05)',
        animation: 'kenburns 20s ease-out forwards',
      }} />

      {/* LAYER 2: Gradient overlay — NOT flat color */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          linear-gradient(
            to bottom,
            rgba(0, 80, 90, 0.3) 0%,
            rgba(0, 50, 60, 0.15) 30%,
            rgba(0, 30, 40, 0.5) 70%,
            rgba(0, 10, 15, 0.85) 100%
          )
        `,
      }} />

      {/* LAYER 3: Subtle vignette on sides */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(
            ellipse at center,
            transparent 40%,
            rgba(0, 20, 25, 0.6) 100%
          )
        `,
      }} />

      {/* CONTENT */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '0 1.5rem',
      }}>
        {/* TAGLINE */}
        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
          marginBottom: '1rem',
        }}>
          <span style={{
            background: 'rgba(245,124,0,0.2)',
            border: '1px solid rgba(245,124,0,0.5)',
            color: '#FFC107',
            padding: '6px 20px',
            borderRadius: '50px',
            fontSize: '0.85rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: '600',
          }}>
            Est. 1995 · Dhaka, Bangladesh
          </span>
        </div>

        {/* MAIN HEADING */}
        <h1 style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
          fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
          fontWeight: '800',
          lineHeight: '1.15',
          margin: '0 0 1.2rem 0',
          maxWidth: '800px',
        }}>
          <span style={{ color: '#ffffff' }}>Building Skills, </span>
          <br />
          <span style={{
            color: '#F57C00',
            textShadow: '0 0 40px rgba(245,124,0,0.4)',
          }}>
            Building Futures
          </span>
        </h1>

        {/* SUBTITLE */}
        <p style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease 0.55s, transform 0.8s ease 0.55s',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          maxWidth: '550px',
          lineHeight: '1.6',
          margin: '0 0 0.5rem 0',
        }}>
          UCEP Institute of Science and Technology, Dhaka
        </p>

        {/* BUTTONS */}
        <div className="hero-buttons" style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.6s ease 0.9s, transform 0.6s ease 0.9s',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'linear-gradient(135deg, #F57C00, #FF9800)',
              color: 'white',
              border: 'none',
              padding: '14px 36px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(245,124,0,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 8px 30px rgba(245,124,0,0.5)'
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 20px rgba(245,124,0,0.4)'
            }}
          >
            Explore Courses
          </button>

          <button style={{
            background: 'transparent',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.8)',
            padding: '14px 36px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(255,255,255,0.15)'
              e.target.style.borderColor = 'white'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'transparent'
              e.target.style.borderColor = 'rgba(255,255,255,0.8)'
            }}
          >
            Apply Now
          </button>
        </div>

        {/* SCROLL INDICATOR */}
        <div style={{
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1s ease 1.5s',
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          animation: 'bounce 2s ease infinite',
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.7rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>Scroll</span>
          <div style={{
            width: '24px',
            height: '38px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px',
          }}>
            <div style={{
              width: '4px',
              height: '8px',
              background: '#F57C00',
              borderRadius: '2px',
              animation: 'scrolldot 1.5s ease infinite',
            }} />
          </div>
        </div>
      </div>

      {/* BOTTOM WAVE */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        lineHeight: 0,
      }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none"
          style={{ width: '100%', height: '80px' }}>
          <path fill="white"
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  )
}
