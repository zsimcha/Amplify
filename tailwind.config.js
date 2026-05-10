/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Softer, color-tinted shadows that float instead of "drop"
        'soft': '0 4px 20px -4px rgba(15, 23, 42, 0.08)',
        'soft-lg': '0 12px 40px -8px rgba(15, 23, 42, 0.10)',
        'soft-xl': '0 20px 50px -12px rgba(11, 19, 43, 0.18)',
        'amber-glow': '0 12px 40px -8px rgba(217, 175, 62, 0.35)',
      },
    },
  },
  plugins: [],
}