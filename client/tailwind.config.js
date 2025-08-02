module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary color palette
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Status colors
        status: {
          good: '#10b981',     // green-500
          warning: '#f59e0b',  // amber-500
          critical: '#ef4444', // red-500
        },
        // Dashboard specific colors
        dashboard: {
          background: {
            light: '#f8fafc',
            dark: '#0f172a',
          },
          card: {
            light: '#ffffff',
            dark: '#1e293b',
          },
          text: {
            light: '#334155',
            dark: '#f1f5f9',
          },
        },
      },
      // Custom shadows
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'sidebar': '2px 0 10px rgba(0, 0, 0, 0.1)',
      },
      // Custom transitions
      transitionTimingFunction: {
        'sidebar': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Custom animation durations
      animation: {
        'sidebar-open': 'sidebar-open 0.3s ease-out forwards',
        'sidebar-close': 'sidebar-close 0.3s ease-in forwards',
      },
      // Custom keyframes
      keyframes: {
        'sidebar-open': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'sidebar-close': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
