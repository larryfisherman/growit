// mobile/src/theme/components/Chip.tsx
// Small monospace label with optional dot. Used for status / version / eyebrows.

import { View, Text } from 'react-native';

type Props = {
  label: string;
  dot?: boolean;
};

export const Chip = ({ label, dot = false }: Props) => (
  <View className="flex-row items-center gap-2 px-3 py-1 border border-line rounded-pill self-start">
    {dot && <View className="w-1.5 h-1.5 rounded-full bg-lime" />}
    <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">
      {label}
    </Text>
  </View>
);
