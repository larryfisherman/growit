// GrowIt design values - the one place they are written down.
//
// Plain CommonJS on purpose: tailwind.config.js is loaded by Node (through NativeWind's
// Metro transformer) and cannot import TypeScript, while src/theme/tokens.ts imports this
// too. Both build their own shapes from it, so a colour, font or size changes here only.
// Types live in palette.d.ts.

const palettes = {
  dark: {
    bg:         '#0a0a0a',
    surface:    '#141414',
    surface2:   '#1c1c1c',
    fg:         '#f5f5f3',
    muted:      '#8a8a86',
    dim:        '#5a5a56',
    lime:       '#d4ff3a',
    limeInk:    '#0a0a0a',
    line:       'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.16)',
  },
  // Not used yet: ThemeProvider still forces dark. Kept so light mode can be switched on.
  light: {
    bg:         '#fafaf7',
    surface:    '#ffffff',
    surface2:   '#f3f3ee',
    fg:         '#0a0a0a',
    muted:      '#6a6a66',
    dim:        '#a0a09a',
    lime:       '#a3cc1f',
    limeInk:    '#0a0a0a',
    line:       'rgba(0,0,0,0.08)',
    lineStrong: 'rgba(0,0,0,0.16)',
  },
};

const semantic = {
  success: '#52d97c',
  danger:  '#ff5a4e',
  warning: '#ffb84e',
};

// These names match those loaded via @expo-google-fonts in App.tsx.
const font = {
  sansRegular: 'SpaceGrotesk_400Regular',
  sansMedium:  'SpaceGrotesk_500Medium',
  sansSemi:    'SpaceGrotesk_600SemiBold',
  sansBold:    'SpaceGrotesk_700Bold',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium:  'JetBrainsMono_500Medium',
};

// Font size and line height, in px.
const typeScale = {
  display: { size: 50, lineHeight: 48 },
  h1:      { size: 32, lineHeight: 34 },
  h2:      { size: 24, lineHeight: 28 },
  h3:      { size: 19, lineHeight: 23 },
  bodyLg:  { size: 17, lineHeight: 24 },
  body:    { size: 15, lineHeight: 22 },
  bodySm:  { size: 13, lineHeight: 18 },
  label:   { size: 11, lineHeight: 15 },
  labelSm: { size: 9,  lineHeight: 13 },
};

// Corner radii, in px.
const radius = { sm: 4, md: 6, lg: 10, xl: 16 };

module.exports = { palettes, semantic, font, typeScale, radius };
