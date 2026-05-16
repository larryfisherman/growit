import { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { tokens } from '../tokens';

type Props = Omit<TextInputProps, 'placeholderTextColor'> & {
  label?: string;
  error?: string;
};

export const Input = ({ label, error, onFocus, onBlur, ...rest }: Props) => {
  const [focused, setFocused] = useState(false);
  const borderClass = error
    ? 'border-danger'
    : focused
      ? 'border-line-strong'
      : 'border-line';

  return (
    <View className="gap-2">
      {label && (
        <Text className="text-muted font-mono-md text-label tracking-label uppercase">
          {label}
        </Text>
      )}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={tokens.color.dim}
        className={`bg-surface border ${borderClass} rounded-md px-4 py-3 text-fg font-sans-md text-body`}
      />
      {error && (
        <Text className="text-danger font-sans-md text-body-sm">{error}</Text>
      )}
    </View>
  );
};
