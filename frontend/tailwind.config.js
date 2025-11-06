/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'alvorada-blue': '#5B8DBE',
        'alvorada-blue-dark': '#4A7BA7',
        'alvorada-coral': '#E8927C',
        'alvorada-coral-dark': '#D67A64',
        'alvorada-gold': '#F4C95D',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out'
      }
    },
  },
  plugins: [],
}
