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
        'seat-available': '#e2e8f0',
        'seat-held': '#fef08a',
        'seat-booked': '#94a3b8',
        'seat-offered': '#bbf7d0',
        'seat-mine': '#60a5fa',
      },
    },
  },
  plugins: [],
};
