import { Text } from 'react-native';

/// Confirms that a fresh verification code went out. Callers decide when it shows.
export const CodeSentNotice = () => (
  <Text className="text-lime font-mono-md text-label-sm tracking-label uppercase mt-4">
    Nowy kod został wysłany
  </Text>
);
