/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5fa',
          100: '#dce7f3',
          200: '#b6cfE7',
          300: '#83abd6',
          400: '#4e82c2',
          500: '#1e5a9e',
          600: '#1e3a5f',
          700: '#152c48',
          800: '#0e1f33',
          900: '#08121f',
        },
        accent: {
          50: '#fff8e6',
          100: '#ffefbf',
          200: '#ffe488',
          300: '#ffd755',
          400: '#ffcb33',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
