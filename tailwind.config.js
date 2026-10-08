/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#faf9f6', // warm off-white background
          card: '#ffffff',
          subtle: '#f4f3ef',
          border: '#e7e5e0'
        },
        charcoal: {
          DEFAULT: '#1c1917', // dark charcoal text
          muted: '#57534e',
          light: '#78716c'
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          600: '#0d9488',
          700: '#0f766e', // muted deep teal primary
          800: '#115e59',
          900: '#134e4a',
        },
        urgent: {
          bg: '#fee2e2',
          text: '#991b1b',
          badge: '#b91c1c'
        },
        soon: {
          bg: '#fef3c7',
          text: '#92400e',
          badge: '#d97706'
        },
        safe: {
          bg: '#dcfce7',
          text: '#166534',
          badge: '#15803d'
        }
      },
      fontSize: {
        'touch-base': ['1.125rem', { lineHeight: '1.6rem' }], // 18px
        'touch-lg': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        'touch-xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
        'touch-2xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      }
    },
  },
  plugins: [],
}
