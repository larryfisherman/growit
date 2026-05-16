import { Pressable, Text, View, PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../tokens';

type Provider = 'apple' | 'google';

type Props = PressableProps & {
  provider: Provider;
};

const config: Record<Provider, { label: string; icon: 'logo-apple' | 'logo-google' }> = {
  apple: { label: 'Kontynuuj z Apple', icon: 'logo-apple' },
  google: { label: 'Kontynuuj z Google', icon: 'logo-google' },
};

export const SocialButton = ({ provider, disabled, ...rest }: Props) => {
  const { label, icon } = config[provider];
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      className={`bg-fg rounded-md py-4 flex-row items-center justify-center gap-2 w-full ${disabled ? 'opacity-60' : ''}`}
    >
      <Ionicons name={icon} size={18} color={tokens.color.bg} />
      <Text className="text-bg font-sans-b text-body-sm tracking-label uppercase">
        {label}
      </Text>
    </Pressable>
  );
};
