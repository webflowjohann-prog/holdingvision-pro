/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#FDFCFA", 100: "#FAF8F4", 200: "#F5F0EB" },
        gold: { 400: "#d4b062", 500: "#b8963e", 600: "#9a7a2f" },
        societe: "#0d7c5f",
        holding: "#a08430",
        foyer: "#2d6ab8",
        sci: "#6b4fa0",
        placement: "#2a7d3f",
        invest: "#5a7a20",
        fisc: "#b83d2a",
        source: "#6b6a65",
      },
      fontFamily: {
        heading: ['"Instrument Serif"', "serif"],
        body: ["Syne", "sans-serif"],
        mono: ['"Space Mono"', "monospace"],
        paragraph: ['"Cormorant Garamond"', "serif"],
      },
    },
  },
  plugins: [],
}
