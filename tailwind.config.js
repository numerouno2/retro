/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d0d12',
          primary: '#13131a',
          secondary: '#1a1a24',
          card: '#1f1f2e',
          input: '#262635',
          hover: '#2a2a3d',
        },
        accent: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
        },
      },
    },
  },
  plugins: [],
}