// Generated with AI assistance (Antigravity). Reviewed by the team.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F4F7F2',
          dark: '#0E1A15',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#14251E',
        },
        panel: {
          DEFAULT: '#E9F1EA',
          dark: '#1B332A',
        },
        primary: {
          DEFAULT: '#1F7A5A',
          hover: '#19664B',
          deep: '#0F3D2E',
        },
        mint: {
          DEFAULT: '#8FD3B6',
          light: '#D4EFE3',
        },
        sand: {
          DEFAULT: '#EFE8DA',
          light: '#F8F5EE',
        },
        ink: {
          DEFAULT: '#13211B',
          light: '#284136',
        },
        muted: {
          DEFAULT: '#5E6F66',
          light: '#86968E',
        },
        status: {
          green: '#2FA36B',
          orange: '#F2A33A',
          red: '#E5484D',
        },
        border: {
          DEFAULT: '#E2EAE3',
          dark: '#223B30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem', // 20px
        '3xl': '1.75rem', // 28px
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(19, 33, 27, 0.05)',
        hover: '0 8px 30px -4px rgba(19, 33, 27, 0.08)',
      },
    },
  },
  plugins: [],
};
