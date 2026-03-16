/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A8A', // blue-800
          light: '#3B82F6'    // blue-500
        }
      }
    }
  },
  plugins: []
}
