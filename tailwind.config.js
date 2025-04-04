const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Adelle Sans', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'privy-navy': '#160B45',
        'frac-dark-gray': '#1b1b1c',
        'privy-blueish': '#D4D9FC',
        'privy-pink': '#FF8271',

        'primary': '#B76E79',
        'red': '#E2464A',
        'green': '#2FA766',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
