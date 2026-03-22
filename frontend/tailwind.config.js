// tailwind.config.js
export default {
  theme: {
    screens: {
      'xs': '500px',
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-bold': 'inherit',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
