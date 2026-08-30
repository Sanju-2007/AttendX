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
        highblack: {
          DEFAULT: "#000000",
          900: "#0B0F17",
          800: "#1A1F2C",
          700: "#2D3748",
          600: "#4A5568",
        },
        macblue: {
          DEFAULT: "#0071E3",
          light: "#0A84FF",
          subtle: "#EBF5FF",
          dark: "#0058B0",
        },
        surface: {
          white: "#FFFFFF",
          subtle: "#F5F5F7",
          border: "rgba(0, 0, 0, 0.08)",
        }
      },
      boxShadow: {
        'mac-window': '0 25px 60px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
        'mac-card': '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
        'mac-button': '0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
      },
      borderRadius: {
        'mac': '1.25rem',
        'mac-lg': '1.75rem',
        'mac-xl': '2.25rem',
      },
    },
  },
  plugins: [],
};
export default config;
