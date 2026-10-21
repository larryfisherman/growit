import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { BackButton } from '../../../theme/components/BackButton';
import { AuthStackParamList } from '../../../navigation/AuthStack';
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = ({ route, navigation }: Props) => {
  // Carried over from the login screen, so a user who typed it there does not type it twice.
  const [email, setEmail] = useState(route.params.email ?? '');
  const request = useRequestPasswordReset();

  const trimmedEmail = email.trim().toLowerCase();

  const handleSubmit = () =>
    request.mutate(trimmedEmail, {
      onSuccess: () => navigation.replace('ResetPassword', { email: trimmedEmail }),
    });

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-7 pb-7 grow"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <View className="mt-4">
          <BackButton />
        </View>

        <View className="mt-16">
          <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-4">
            [ RESET HASŁA ]
          </Text>
          <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
            Nie pamiętasz{'\n'}
            <Text className="text-lime">hasła?</Text>
          </Text>
          <Text className="text-muted font-sans-md text-body mt-4">
            Podaj email konta. Wyślemy na niego kod do ustawienia nowego hasła.
          </Text>
        </View>

        <View className="mt-10">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="ty@example.com"
          />
        </View>

        {request.error && (
          <Text className="text-danger font-mono-md text-label-sm tracking-label uppercase mt-4">
            {request.error.message}
          </Text>
        )}

        <View className="mt-auto pt-10">
          <Button
            label={request.isPending ? 'Wysyłam...' : 'Wyślij kod →'}
            variant="primary"
            onPress={handleSubmit}
            disabled={!trimmedEmail || request.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
