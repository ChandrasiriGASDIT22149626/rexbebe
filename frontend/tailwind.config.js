/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // REXBEBE Core Brand Colors (Derived from Logo)
        rexbebe: {
          aqua: '#38BDF8',
          'aqua-50': '#F0F9FF',
          'aqua-100': '#E0F2FE',
          'aqua-200': '#BAE6FD',
          'aqua-300': '#7DD3FC',
          'aqua-400': '#38BDF8',
          'aqua-500': '#0EA5E9',
          'aqua-600': '#0284C7',

          orange: '#F97316',
          'orange-50': '#FFF7ED',
          'orange-100': '#FFEDD5',
          'orange-200': '#FED7AA',
          'orange-300': '#FDBA74',
          'orange-400': '#FB923C',
          'orange-500': '#F97316',

          lavender: '#A78BFA',
          'lavender-50': '#FAF5FF',
          'lavender-100': '#F3E8FF',
          'lavender-200': '#DDD6FE',

          pink: '#F472B6',
          'pink-50': '#FDF2F8',
          'pink-100': '#FCE7F3',
          'pink-200': '#FBCFE8',

          mint: '#A7F3D0',
          'mint-50': '#ECFDF5',
          'mint-100': '#D1FAE5',

          yellow: '#FDE047',
          'yellow-50': '#FEFCE8',
          'yellow-100': '#FEF9C3',

          cream: '#FAF9F6',
          charcoal: '#1E1B2E',
        },
        // Backward compatibility brand mapping
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
      },
      borderRadius: {
        '4xl': '2.5rem',
        '3xl': '1.75rem',
        '2xl': '1.25rem',
        'xl': '0.875rem',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
