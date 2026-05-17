import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { palettes, semantic, PaletteColors } from './tokens';

type ThemeColors = PaletteColors & typeof semantic;

export const useTheme = () => {
  const { mode } = useContext(ThemeContext);
  const colors: ThemeColors = { ...palettes[mode], ...semantic };
  return { mode, colors };
};
