module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Adelle Sans'],
      },
      colors: {
        'privy-navy': '#160B45',
        'frac-dark-gray': '#1b1b1c',
        'privy-blueish': '#D4D9FC',
        'privy-pink': '#FF8271',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};