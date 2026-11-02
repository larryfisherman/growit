import { ReactNode } from 'react';
import { Text } from 'react-native';

/// The muted, mono, upper-case "[ LABEL ]" heading used above sections and lists.
/// Callers pass the bracketed text as children and any spacing (mb-3, mt-2...) via className.
export const SectionLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Text
    className={`text-muted font-mono-md text-label tracking-label uppercase${className ? ` ${className}` : ''}`}
  >
    {children}
  </Text>
);
