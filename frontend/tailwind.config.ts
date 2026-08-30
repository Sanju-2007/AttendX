import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        richblack: {
          950: "#030712",
          900: "#050811",
          800: "#0A0F1D",
          700: "#0F172A",
          600: "#1E293B",
        },
        waterblue: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
        },
        primary: {
          DEFAULT: "#0284C7",
          light: "#38BDF8",
          dark: "#0369A1",
        },
        secondary: {
          DEFAULT: "#0EA5E9",
          light: "#7DD3FC",
        },
        dark: "#060913",
        light: "#FFFFFF",
      },
      boxShadow: {
        'water-drop': '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 2px 0 rgba(14, 165, 233, 0.2), 0 0 20px -5px rgba(14, 165, 233, 0.15)',
        'water-glow': '0 0 30px -5px rgba(14, 165, 233, 0.35)',
        'water-inner': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 4px 0 rgba(14, 165, 233, 0.15)',
      },
      borderRadius: {
        'droplet': '2rem',
        'droplet-lg': '2.5rem',
      },
      keyframes: {
        'water-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'water-pulse': 'water-pulse 6s ease-in-out infinite',
        'ripple': 'ripple 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'float-slow': 'float-slow 5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
export default config;
