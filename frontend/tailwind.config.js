/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#1A233A',
        surfaceHover: '#222D47',
        primary: '#4F46E5', // Indigo-600
        secondary: '#10B981', // Emerald-500
        accent: '#F59E0B', // Amber-500
        danger: '#EF4444', // Red-500
        text: '#F3F4F6', // Gray-100
        textMuted: '#9CA3AF', // Gray-400
        border: '#374151', // Gray-700
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
