import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocre: {
          50: '#FFF8E8',
          100: '#FEF3D2',
          200: '#FDE6A8',
          300: '#FCD97E',
          400: '#FBCC54',
          500: '#F5A623',
          600: '#E69500',
          700: '#D78400',
          800: '#C87300',
          900: '#B96200',
        },
        vert: {
          50: '#E8F5E8',
          100: '#D2F0D2',
          200: '#A8E6A8',
          300: '#7EDC7E',
          400: '#54D254',
          500: '#00A651',
          600: '#008A42',
          700: '#006E33',
          800: '#005224',
          900: '#003615',
        },
        gris: {
          50: '#F8F4E8',
          100: '#F0E6D8',
          200: '#E8DCC8',
          300: '#E0D2B8',
          400: '#D8C8A8',
          500: '#D0BE98',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
