/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#b4692f", // Bronze/Copper
                "primary-hover": "#8c4f21",
                secondary: "#334155", // Slate 700
                dark: "#1e293b", // Slate 800
                paper: "#fdfbf7", // Warm Cream
                surface: "#ffffff",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Lora', 'serif'], // Added serif for headings
            },
            borderRadius: {
                'lg': '0.5rem',   // 8px - tighter than before
                'xl': '0.75rem',  // 12px
                '2xl': '1rem',    // 16px - Max roundness, avoiding the 'pill' look for big cards
            },
            boxShadow: {
                'artisan': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(180, 105, 47, 0.1)', // Subtle copper inset
            }
        },
    },
    plugins: [],
}
