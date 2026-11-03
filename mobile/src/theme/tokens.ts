// GrowIt design tokens for inline styles - use `tokens.color.lime` when className isn't
// enough. The values come from ./palette.js, which tailwind.config.js reads as well.

import { font, palettes, radius, semantic, typeScale } from './palette';

export { palettes, semantic };
export type ThemeMode = keyof typeof palettes;
export type PaletteColors = (typeof palettes)['dark'];

const type = (step: keyof typeof typeScale) => ({
  fontSize: typeScale[step].size,
  lineHeight: typeScale[step].lineHeight,
});

export const tokens = {
  color: {
    ...palettes.dark,
    ...semantic,
  },

  font,

  type: {
    display: { ...type('display'), fontFamily: font.sansBold, letterSpacing: -2 },
    h1:      { ...type('h1'), fontFamily: font.sansBold, letterSpacing: -1 },
    h2:      { ...type('h2'), fontFamily: font.sansBold, letterSpacing: -0.6 },
    h3:      { ...type('h3'), fontFamily: font.sansBold, letterSpacing: -0.4 },
    bodyLg:  { ...type('bodyLg'), fontFamily: font.sansMedium },
    body:    { ...type('body'), fontFamily: font.sansMedium },
    bodySm:  { ...type('bodySm'), fontFamily: font.sansMedium },
    label:   { ...type('label'), fontFamily: font.monoMedium, letterSpacing: 1.8, textTransform: 'uppercase' as const },
    labelSm: { ...type('labelSm'), fontFamily: font.monoMedium, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  },

  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: { ...radius, pill: 999 },
};
