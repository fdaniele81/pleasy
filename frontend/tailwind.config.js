// tailwind.config.js
export default {
  theme: {
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
