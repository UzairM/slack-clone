/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#4A154B',
          light: '#611f64',
          dark: '#340e35',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#36C5F0',
          light: '#4fd3ff',
          dark: '#2bb7e0',
          foreground: '#000000',
        },
        success: {
          DEFAULT: '#2EB67D',
          light: '#34d492',
          dark: '#279d6b',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#E01E5A',
          light: '#f43d75',
          dark: '#c91a4f',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1E1D1E',
          foreground: '#888888',
        },
        accent: {
          DEFAULT: '#36C5F0',
          foreground: '#000000',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1E1D1E',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1E1D1E',
        },
        slack: {
          purple: '#4A154B',
          blue: '#36C5F0',
          green: '#2EB67D',
          red: '#E01E5A',
          yellow: '#ECB22E',
          black: '#1E1D1E',
          gray: '#616061',
          lightGray: '#F8F8F8',
          white: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
        'slide-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-to-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
        'slide-from-left': 'slide-from-left 0.3s ease-out',
        'slide-to-left': 'slide-to-left 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
