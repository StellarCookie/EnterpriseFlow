/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5b4ad1',
          accent: '#6a63d4',
          lavender: '#b48bd0',
          pink: '#f0a4c4',
          'light-pink': '#f3c9dc',
          bg: '#f7f1f8',
          ink: '#352a6e',
        },
      },
    },
  },
  plugins: [],
}
