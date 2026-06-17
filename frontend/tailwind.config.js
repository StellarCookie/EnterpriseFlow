/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3a2d93',  
          accent: '#473fa3',   
          // Schimbat de la '#764e94' la un violet profund, mult mai închis și vizibil:
          lavender: '#512c6d', 
          pink: '#ba5881',     
          'light-pink': '#de9cb9', 
          bg: '#f7f1f8',
          ink: '#1e1545',      
        },
      },
      fontFamily: {
        sans: ['"Noto Serif"', 'serif'],
      },
    },
  },
  plugins: [],
}