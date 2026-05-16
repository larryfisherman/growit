// mobile/tailwind.config.js
// Extends NativeWind/Tailwind with GrowIt tokens.
// Keep in sync with src/theme/tokens.ts.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // surfaces
        bg:         '#0a0a0a',
        surface:    '#141414',
        surface2:   '#1c1c1c',
        // text
        fg:         '#f5f5f3',
        muted:      '#8a8a86',
        dim:        '#5a5a56',
        // accent
        lime:       '#d4ff3a',
        'lime-ink': '#0a0a0a',
        // semantic
        success:    '#52d97c',
        danger:     '#ff5a4e',
        warning:    '#ffb84e',
        // strokes (use as border-line / border-line-strong)
        line:         'rgba(255,255,255,0.08)',
        'line-strong':'rgba(255,255,255,0.16)',
      },

      fontFamily: {
        sans:      ['SpaceGrotesk_500Medium'],
        'sans-md': ['SpaceGrotesk_500Medium'],
        'sans-sb': ['SpaceGrotesk_600SemiBold'],
        'sans-b':  ['SpaceGrotesk_700Bold'],
        mono:      ['JetBrainsMono_400Regular'],
        'mono-md': ['JetBrainsMono_500Medium'],
      },

      fontSize: {
        // [size, lineHeight]
        display:  ['50px', '48px'],
        h1:       ['32px', '34px'],
        h2:       ['24px', '28px'],
        h3:       ['19px', '23px'],
        'body-lg':['17px', '24px'],
        body:     ['15px', '22px'],
        'body-sm':['13px', '18px'],
        label:    ['11px', '15px'],
        'label-sm':['9px', '13px'],
      },

      letterSpacing: {
        tightest: '-0.045em',
        display:  '-0.04em',
        tight:    '-0.02em',
        label:    '0.16em',
      },

      spacing: {
        // tailwind already covers 0-96; add semantic tokens you can swap later
      },

      borderRadius: {
        sm:   '4px',
        md:   '6px',
        lg:   '10px',
        xl:   '16px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
