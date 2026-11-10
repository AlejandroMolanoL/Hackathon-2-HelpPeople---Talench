/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 10px 35px -5px rgba(0, 0, 0, 0.04), 0 2px 10px -2px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 20px 45px -10px rgba(0, 0, 0, 0.07)',
        'coral': '0 12px 30px -5px rgba(255, 94, 126, 0.35)',
      },
      colors: {
        canvas: {
          light: '#F4F5F8',
          card: '#FFFFFF',
          dark: '#101420',
          darker: '#0B0E17',
          sidebar: '#111522',
        },
        coral: {
          400: '#FF7A59',
          500: '#FF5E7E',
          600: '#E84568',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      }
    },
  },
  plugins: [],
}

