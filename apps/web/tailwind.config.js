/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Nest scales so DEFAULT + shades both resolve (avoids linen/linen-* clash)
        ink: {
          DEFAULT: '#16231C',
          soft: '#4A554D',
          faint: '#8B9289',
        },
        canopy: {
          DEFAULT: '#1F4D3A',
          600: '#2D6A4F',
        },
        fern: {
          DEFAULT: '#4E9271',
          tint: '#DCEBE1',
        },
        linen: {
          DEFAULT: '#F6F2E9',
          raised: '#FFFFFF',
          sunken: '#EDE7D9',
        },
        ember: {
          DEFAULT: '#C97A3D',
          tint: '#FBEBDD',
        },
        'signal-red': {
          DEFAULT: '#B54339',
          tint: '#FBE9E6',
        },
        'signal-amber': {
          DEFAULT: '#B8863D',
          tint: '#FBF2E0',
        },

        // Semantic aliases (keep existing classnames working)
        warm: '#F6F2E9',
        surface: {
          DEFAULT: '#F6F2E9',
          dim: '#EDE7D9',
          soft: '#EDE7D9',
          'container-lowest': '#FFFFFF',
          'container-low': '#F6F2E9',
          container: '#EDE7D9',
        },
        'on-surface': {
          DEFAULT: '#16231C',
          variant: '#4A554D',
        },
        outline: {
          DEFAULT: '#8B9289',
          variant: '#EDE7D9',
        },
        primary: {
          DEFAULT: '#2D6A4F',
          container: '#1F4D3A',
          fixed: '#DCEBE1',
          'fixed-dim': '#4E9271',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#DCEBE1',
        },
        'inverse-primary': '#4E9271',
        'tertiary-fixed': '#FBEBDD',
        secondary: {
          DEFAULT: '#4A554D',
          container: '#DCEBE1',
        },
        'on-secondary-container': '#1F4D3A',
        tertiary: {
          DEFAULT: '#C97A3D',
          container: '#8A4E1F',
        },
        'badge-sky': '#DCEBE1',
        status: {
          healthy: '#4E9271',
          mild: '#B8863D',
          warning: '#C97A3D',
          severe: '#B54339',
        },
        error: '#B54339',
        severe: '#B54339',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Public Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-lg': ['42px', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '300' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '300' }],
        'headline-lg-mobile': ['28px', { lineHeight: '1.2', fontWeight: '300' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.65', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
        'ai-badge': ['11px', { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '600' }],
        mono: ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      maxWidth: {
        container: '640px',
        landing: '72rem',
        assess: '48rem',
      },
      spacing: {
        gutter: '24px',
        'margin-mobile': '20px',
        'stack-gap': '32px',
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '10px',
        md: '14px',
        lg: '14px',
        xl: '14px',
        pill: '999px',
      },
      boxShadow: {
        elevated: '0 4px 16px rgba(22, 35, 28, 0.10)',
        soft: '0 1px 3px rgba(22, 35, 28, 0.08)',
        card: '0 4px 16px rgba(22, 35, 28, 0.10)',
        modal: '0 12px 32px rgba(22, 35, 28, 0.14)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        instant: '100ms',
        base: '250ms',
        score: '1200ms',
        loading: '1400ms',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
};
