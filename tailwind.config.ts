import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pixel-pink': '#FFD6E0',
        'pixel-mint': '#D4F0E0',
        'pixel-lavender': '#E0D6FF',
        'pixel-peach': '#FFE4D6',
        'neon-pink': '#FF6B9D',
        'neon-cyan': '#6BFFE0',
        'neon-purple': '#B66BFF',
      },
      fontFamily: {
        pixel: ['Pixelify Sans', 'monospace'],
        wenkai: ['LXGW WenKai', 'serif'],
      },
      boxShadow: {
        pixel: '2px 2px 0 rgba(0, 0, 0, 0.1)',
        'pixel-lg': '4px 4px 0 rgba(0, 0, 0, 0.15)',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
