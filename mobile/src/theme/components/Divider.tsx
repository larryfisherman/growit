import { View, Text } from 'react-native';

type Props = {
  label?: string;
};

export const Divider = ({ label }: Props) => {
  if (!label) {
    return <View className="h-px bg-line w-full" />;
  }
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 h-px bg-line" />
      <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">
        {label}
      </Text>
      <View className="flex-1 h-px bg-line" />
    </View>
  );
};
