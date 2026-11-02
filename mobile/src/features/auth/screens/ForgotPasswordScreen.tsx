import { useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { AuthStackParamList } from '../../../navigation/types';
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthError } from '../components/AuthError';
import { normalizeEmail } from '../credentials';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = ({ route, navigation }: Props) => {
  // Carried over from the login screen, so a user who typed it there does not type it twice.
  const [email, setEmail] = useState(route.params.email ?? '');
  const request = useRequestPasswordReset();

  const trimmedEmail = normalizeEmail(email);

  const handleSubmit = () =>
    request.mutate(trimmedEmail, {
      onSuccess: () => navigation.replace('ResetPassword', { email: trimmedEmail }),
    });

  return (
    <AuthScreenLayout
      eyebrow="[ RESET HASŁA ]"
      title="Nie pamiętasz"
      accent="hasła?"
      lead="Podaj email konta. Wyślemy na niego kod do ustawienia nowego hasła."
    >
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

      <AuthError message={request.error?.message} />

      <View className="mt-auto pt-10">
        <Button
          label={request.isPending ? 'Wysyłam...' : 'Wyślij kod →'}
          variant="primary"
          onPress={handleSubmit}
          disabled={!trimmedEmail || request.isPending}
        />
      </View>
    </AuthScreenLayout>
  );
};
