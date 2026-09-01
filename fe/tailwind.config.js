/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        thai: ['"Noto Sans Thai"', 'sans-serif'],
      },
      colors: {
        headerBg: '#2E9B8F',
        sidebarBg: '#D6F0E8',
        sidebarActiveText: '#1F6E63',
        pageBg: '#F7FAFA',
        kpiCyan: '#7FE0EA',
        kpiGreen: '#C9EFA0',
        kpiPurple: '#D9C7F0',
        pillActive: '#4FA8E8',
        searchBtn: '#2563EB',
        chartBar: '#BFA6A0',
        tooltipBg: '#8FD9CE',
        successBanner: '#D9F2C4',
        textBody: '#333333',
        peaBorder: '#E2E8E8',
        avatarBadge: '#EC4899',
      },
    },
  },
  plugins: [],
}
