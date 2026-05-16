/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: '#0f2040',
        blue: '#1d4ed8',
        accent: '#3b82f6',
        gold: '#f59e0b',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        surface: '#ffffff',
        bg: '#f0f4f8',
        muted: '#64748b',
        text: '#0f172a',
        ucep: {
          orange: '#F57C00',
          teal: '#00ACC1',
          darkteal: '#00838F',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(15,32,64,0.08)',
        hover: '0 16px 48px rgba(15,32,64,0.16)',
        '3d': '0 32px 64px rgba(15,32,64,0.20)',
      },
    },
  },
  plugins: [],
}
