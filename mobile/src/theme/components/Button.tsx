// Two variants: primary (lime) + secondary (outline).
// Reusable across the app. Add more variants as the design grows.

import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';
import { tokens } from '../tokens';

type Variant = 'primary' | 'secondary';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
};

const base =
  'rounded-md py-4 items-center justify-center';

const variants: Record<Variant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: 'bg-lime',
    text: 'text-lime-ink font-sans-b text-body-sm tracking-label uppercase',
    spinner: tokens.color.limeInk,
  },
  secondary: {
    container: 'bg-transparent border border-line',
    text: 'text-fg font-sans-sb text-body-sm tracking-label uppercase',
    spinner: tokens.color.fg,
  },
};

export const Button = ({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}: Props) => {
  const v = variants[variant];
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${v.container} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <Text className={v.text}>{label}</Text>
      )}
    </Pressable>
  );
};
