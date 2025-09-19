/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand Colors
        azure: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#27aae1',
          600: '#1e8bc3',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        magenta: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ea078b',
          600: '#d4067a',
          700: '#b80568',
          800: '#9d1b64',
          900: '#831843',
        },
        brand: {
          azure: '#27aae1',
          magenta: '#ea078b',
          yellow: '#fbec20',
          orange: '#f89d1d',
          black: '#000000',
        }
      },
    },
  },
  plugins: [],
}
