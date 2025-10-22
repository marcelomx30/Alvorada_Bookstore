/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colors from your logo
        'alvorada-blue': '#5B7FA6',
        'alvorada-coral': '#C96850',
        'alvorada-gold': '#D4A86A',
        'alvorada-blue-dark': '#4A6685',
        'alvorada-coral-dark': '#A85240',
      },
    },
  },
  plugins: [],
}
