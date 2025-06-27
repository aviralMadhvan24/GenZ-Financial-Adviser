/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false,
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',         // your main violet
        'primary-dark': '#6E47C1',  // a darker variant for gradients & hovers
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
