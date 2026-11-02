import { Text } from 'react-native';

/// The red, upper-case error line shown under an auth form. Renders nothing without a message.
export const AuthError = ({ message }: { message?: string | null }) =>
  message ? (
    <Text className="text-danger font-mono-md text-label-sm tracking-label uppercase mt-4">
      {message}
    </Text>
  ) : null;
