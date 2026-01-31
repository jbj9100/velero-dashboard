/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    950: '#0A1118',
                    900: '#0F1921',
                    800: '#131D28',
                    700: '#182530',
                },
                primary: {
                    DEFAULT: '#2DD4BF',
                    hover: '#5EEAD4',
                    dark: '#14B8A6',
                },
                success: '#10B981',
                danger: '#EF4444',
                warning: '#F59E0B',
                info: '#3B82F6',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            boxShadow: {
                'elevation-2': '0 4px 6px rgba(0, 0, 0, 0.3)',
                'primary': '0 2px 8px rgba(45, 212, 191, 0.3)',
            },
        },
    },
    plugins: [],
}
