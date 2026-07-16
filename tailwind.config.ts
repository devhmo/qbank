import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f6fc",
          100: "#dbe9f6",
          200: "#b9d6ee",
          300: "#8cbbe1",
          400: "#5b9bd1",
          500: "#3a7ebd",
          600: "#2c649f",
          700: "#265180",
          800: "#24456a",
          900: "#233a59",
          950: "#17263c",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "ui-sans-serif",
          "system-ui",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
