/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./_*/**/*.{html,js,md}",
    "./abc/**/*.{html,js,md}",
    "./assets/**/*.{html,js,md}",
    "./*.{html,js,md}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

