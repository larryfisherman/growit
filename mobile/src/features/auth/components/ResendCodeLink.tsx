import { Pressable, Text } from 'react-native';

/// The "didn't get a code? send again" link at the bottom of the code-entry screens.
export const ResendCodeLink = ({ isPending, onPress }: { isPending: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} disabled={isPending} className="mt-8">
    <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center">
      Nie dostałeś kodu?{' '}
      <Text className="text-fg">{isPending ? 'Wysyłam...' : 'Wyślij ponownie'}</Text>
    </Text>
  </Pressable>
);
