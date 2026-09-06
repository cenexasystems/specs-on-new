/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Specson brand palette ──────────────────────────────────────────
        ivory:        '#F5F3EF', // background / base surface
        'choc-brown': '#3B261B', // primary text / primary buttons
        'near-black': '#1A1410', // headings / high-contrast elements
        'warm-beige': '#D8D0C5', // secondary surfaces, cards, borders, hover

        // Semantic aliases (used as Tailwind utilities across the codebase)
        bgMain:      '#F5F3EF',
        cardBg:      '#D8D0C5',
        textMain:    '#1A1410',
        textMuted:   '#6B7280',
        borderLight: '#D8D0C5',

        // 'maroon' kept as the button/accent colour — now Choc Brown
        maroon: {
          DEFAULT: '#3B261B',
          dark:    '#1A1410',
        },
      },
      fontFamily: {
        sans:      ['Inter', 'sans-serif'],
        headline:  ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft:   '0 1px 3px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'card': '12px',
        'btn': '10px',
        'input': '10px',
        'table': '12px',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'floatDelay': 'float 4s ease-in-out 1.5s infinite',
        'slideUp': 'slideUp 0.6s ease forwards',
        'fadeIn': 'fadeIn 0.5s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
