/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        'seat-available': 'rgba(255,255,255,0.06)',
        'seat-held': '#F59E0B',
        'seat-booked': '#EF4444',
        'seat-offered': '#F59E0B',
        'seat-mine': '#3B82F6',
        'surface-dark': '#0F172A',
        'surface-card': 'rgba(255,255,255,0.05)',
      },
      animation: {
        'pulse-held': 'pulse-held 2s ease-in-out infinite',
        'float-in': 'float-in 0.6s ease both',
        'row-reveal': 'row-reveal 0.4s ease both',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'glow-breathe': 'glow-breathe 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
