/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1115',
        panel: '#171a21',
        panel2: '#1e2230',
        border: '#2a2f3d',
        accent: '#f9a826',
        accent2: '#5dc1ff',
        raw: '#7bd389',
      },
    },
  },
  plugins: [],
};
