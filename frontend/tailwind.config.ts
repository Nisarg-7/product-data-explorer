import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(37 99 235)',
        secondary: 'rgb(79 70 229)',
      },
    },
  },
  plugins: [],
};

export default config;
