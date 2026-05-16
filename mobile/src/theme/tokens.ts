// mobile/src/theme/tokens.ts
// GrowIt design tokens — single source of truth.
// Mirror this file to tailwind.config.js (colors/fontFamily/spacing).
// Use `tokens.color.lime` inline when className isn't enough.

export const tokens = {
  color: {
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
    limeInk:    '#0a0a0a',
    // semantic
    success:    '#52d97c',
    danger:     '#ff5a4e',
    warning:    '#ffb84e',
    // strokes
    line:       'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.16)',
  },

  font: {
    // these names match those loaded via @expo-google-fonts in App.tsx
    sansRegular:  'SpaceGrotesk_400Regular',
    sansMedium:   'SpaceGrotesk_500Medium',
    sansSemi:     'SpaceGrotesk_600SemiBold',
    sansBold:     'SpaceGrotesk_700Bold',
    monoRegular:  'JetBrainsMono_400Regular',
    monoMedium:   'JetBrainsMono_500Medium',
  },

  type: {
    display: { fontSize: 50, lineHeight: 48, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -2 },
    h1:      { fontSize: 32, lineHeight: 34, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -1 },
    h2:      { fontSize: 24, lineHeight: 28, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.6 },
    h3:      { fontSize: 19, lineHeight: 23, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.4 },
    bodyLg:  { fontSize: 17, lineHeight: 24, fontFamily: 'SpaceGrotesk_500Medium' },
    body:    { fontSize: 15, lineHeight: 22, fontFamily: 'SpaceGrotesk_500Medium' },
    bodySm:  { fontSize: 13, lineHeight: 18, fontFamily: 'SpaceGrotesk_500Medium' },
    label:   { fontSize: 11, lineHeight: 15, fontFamily: 'JetBrainsMono_500Medium', letterSpacing: 1.8, textTransform: 'uppercase' as const },
    labelSm: { fontSize:  9, lineHeight: 13, fontFamily: 'JetBrainsMono_500Medium', letterSpacing: 1.6, textTransform: 'uppercase' as const },
  },

  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: { sm: 4, md: 6, lg: 10, xl: 16, pill: 999 },
};

export type Tokens = typeof tokens;
