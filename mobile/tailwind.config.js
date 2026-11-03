// Extends NativeWind/Tailwind with GrowIt tokens. The values come from
// src/theme/palette.js, which src/theme/tokens.ts reads as well.

const { palettes, semantic, font, typeScale, radius } = require('./src/theme/palette');

const dark = palettes.dark;
const px = (value) => `${value}px`;
const fontSize = (step) => [px(step.size), px(step.lineHeight)];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // surfaces
        bg:       dark.bg,
        surface:  dark.surface,
        surface2: dark.surface2,
        // text
        fg:    dark.fg,
        muted: dark.muted,
        dim:   dark.dim,
        // accent
        lime:       dark.lime,
        'lime-ink': dark.limeInk,
        // semantic
        success: semantic.success,
        danger:  semantic.danger,
        warning: semantic.warning,
        // strokes (use as border-line / border-line-strong)
        line:          dark.line,
        'line-strong': dark.lineStrong,
      },

      fontFamily: {
        sans:      [font.sansMedium],
        'sans-md': [font.sansMedium],
        'sans-sb': [font.sansSemi],
        'sans-b':  [font.sansBold],
        mono:      [font.monoRegular],
        'mono-md': [font.monoMedium],
      },

      // [size, lineHeight]
      fontSize: {
        display:    fontSize(typeScale.display),
        h1:         fontSize(typeScale.h1),
        h2:         fontSize(typeScale.h2),
        h3:         fontSize(typeScale.h3),
        'body-lg':  fontSize(typeScale.bodyLg),
        body:       fontSize(typeScale.body),
        'body-sm':  fontSize(typeScale.bodySm),
        label:      fontSize(typeScale.label),
        'label-sm': fontSize(typeScale.labelSm),
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
        sm:   px(radius.sm),
        md:   px(radius.md),
        lg:   px(radius.lg),
        xl:   px(radius.xl),
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
