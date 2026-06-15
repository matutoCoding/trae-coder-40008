/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'mf-orange': '#FF6B35',
        'mf-blue': '#4A90D9',
        'mf-gold': '#C0A062',
        'mf-bg': '#0D0F13',
        'mf-card': '#1E2128',
        'mf-card-hover': '#252830',
        'mf-sidebar': '#14161B',
        'mf-border': '#2D3139',
        'mf-input': '#16181D',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
