const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: 'var(--accent-primary)',
        secondary: '#64748b',
        success: 'var(--color-success)',
        danger: 'var(--color-booked)',
        warning: 'var(--color-held)',

        // Accent ramp
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-purple': 'var(--accent-purple)',

        // Seat semantics
        'seat-available': 'var(--color-available)',
        'seat-selected': 'var(--color-selected)',
        'seat-held': 'var(--color-held)',
        'seat-booked': 'var(--color-booked)',
        'seat-offered': 'var(--color-offered)',
        'seat-mine': 'var(--color-selected)',

        // Surfaces
        'bg-deep': 'var(--bg-deep)',
        'bg-primary': 'var(--bg-primary)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'surface-dark': 'var(--bg-primary)',
        'surface-card': 'var(--glass-bg)',

        // Glass
        glass: 'var(--glass-bg)',
        'glass-hover': 'var(--glass-bg-hover)',
        'glass-border': 'var(--glass-border)',
      },
      textColor: {
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-micro': 'var(--text-micro)',
      },
      borderRadius: {
        seat: '4px',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      boxShadow: {
        'glow-blue': '0 0 8px var(--glow-blue)',
        'glow-amber': '0 0 8px var(--glow-amber)',
        'glow-red': '0 0 8px var(--glow-red)',
        'glow-green': '0 0 8px var(--glow-green)',
        'glow-purple': '0 0 8px var(--glow-purple)',
        'lift-blue': '0 4px 15px var(--glow-blue)',
      },
      letterSpacing: {
        micro: '0.1em',
        display: '-0.5px',
      },
      keyframes: {
        'seat-ripple': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'held-pulse': {
          '0%, 100%': { boxShadow: '0 0 4px var(--glow-amber)' },
          '50%': { boxShadow: '0 0 10px var(--glow-amber)' },
        },
        'offered-pulse': {
          '0%, 100%': { boxShadow: '0 0 4px var(--glow-purple)' },
          '50%': { boxShadow: '0 0 12px var(--glow-purple)' },
        },
        'gradient-drift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'orb-breathe': {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.3' },
        },
        'float-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'row-reveal': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'price-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        'seat-ripple': 'seat-ripple 0.5s ease-out forwards',
        'held-pulse': 'held-pulse 2s ease-in-out infinite',
        'offered-pulse': 'offered-pulse 2s ease-in-out infinite',
        'gradient-drift': 'gradient-drift 8s ease infinite',
        'orb-breathe': 'orb-breathe 4s ease-in-out infinite',
        'float-in': 'float-in 0.6s ease both',
        shimmer: 'shimmer 3s linear infinite',
        'row-reveal': 'row-reveal 0.4s ease both',
        'price-pulse': 'price-pulse 0.25s ease',
      },
    },
  },
  plugins: [],
};
