import { View, Text } from 'react-native';
import { Button } from '../../../theme/components/Button';
import { useAuth } from '../../../auth/AuthContext';

export const SettingsScreen = () => {
  const { email, signOut } = useAuth();

  return (
    <View className="flex-1 bg-bg px-6 pt-6 pb-10">
      <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-3">
        [ KONTO ]
      </Text>

      <View className="bg-surface rounded-md p-4 border border-line">
        <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">Email</Text>
        <Text className="text-fg font-sans-md text-body-lg mt-1">{email}</Text>
      </View>

      <View className="mt-auto">
        <Button label="Wyloguj się" variant="secondary" onPress={signOut} />
      </View>
    </View>
  );
};
