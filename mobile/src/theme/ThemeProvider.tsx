import { createContext, ReactNode } from 'react';
import { ThemeMode } from './tokens';

type ThemeContextValue = {
  mode: ThemeMode;
};

export const ThemeContext = createContext<ThemeContextValue>({ mode: 'dark' });

type ThemeProviderProps = {
  children: ReactNode;
};

// TODO: replace forced 'dark' with user preference (settings toggle) + system fallback once light palette is polished.
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const mode: ThemeMode = 'dark';

  return <ThemeContext.Provider value={{ mode }}>{children}</ThemeContext.Provider>;
};
