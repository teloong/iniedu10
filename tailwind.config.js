/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  safelist: [
    {
      pattern:
        /^(from|to|border|text|hover:border)-(blue|green|pink|cyan|emerald|purple)-(400|500|700)$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        secondary: '#ff9900',
        accent: '#ff3366',
        neutral: '#333333',
        'base-100': '#ffffff',
      },
      fontFamily: {
        sans: ['Roboto Slab', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
