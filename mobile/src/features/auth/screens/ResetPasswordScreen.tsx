import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { BackButton } from '../../../theme/components/BackButton';
import { AuthStackParamList } from '../../../navigation/AuthStack';
import { useConfirmPasswordReset } from '../hooks/useConfirmPasswordReset';
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset';
import { useSignIn } from '../hooks/useSignIn';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

/// Same minimum as registration; Cognito's own policy still has the last word and its
/// refusal is shown as is.
const MIN_PASSWORD_LENGTH = 6;

export const ResetPasswordScreen = ({ route }: Props) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const confirm = useConfirmPasswordReset();
  const resend = useRequestPasswordReset();
  const signIn = useSignIn();

  const error = confirm.error ?? signIn.error ?? resend.error;
  const isSaving = confirm.isPending || signIn.isPending;
  const canSubmit = code.length === 6 && password.length >= MIN_PASSWORD_LENGTH && !isSaving;

  // The new password is known right here, so the user lands in the app rather than back
  // on the login form typing it again.
  //
  // A code works once. If the password was already changed and only the sign-in after it
  // failed, trying again must not spend the code a second time - Cognito would refuse it
  // and the screen would claim the reset failed when it did not.
  const handleSubmit = () =>
    confirm.isSuccess
      ? signIn.mutate({ email, password })
      : confirm.mutate(
          { email, code, newPassword: password },
          { onSuccess: () => signIn.mutate({ email, password }) },
        );

  const handleResend = () => {
    // The error on screen belongs to the old code. A reset that already went through stays
    // on record, or the next tap would spend a code again.
    if (!confirm.isSuccess) confirm.reset();
    signIn.reset();
    resend.mutate(email);
  };

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
            [ NOWE HASŁO ]
          </Text>
          <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
            Sprawdź{'\n'}
            <Text className="text-lime">skrzynkę.</Text>
          </Text>
          <Text className="text-muted font-sans-md text-body mt-4">
            Jeśli <Text className="text-fg">{email}</Text> ma konto, wysłaliśmy na niego 6-cyfrowy
            kod. Wpisz go i ustaw nowe hasło.
          </Text>
        </View>

        <View className="gap-4 mt-10">
          <Input
            label="Kod weryfikacyjny"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
          />
          <Input
            label="Nowe hasło"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder={`min. ${MIN_PASSWORD_LENGTH} znaków`}
          />
        </View>

        {error && (
          <Text className="text-danger font-mono-md text-label-sm tracking-label uppercase mt-4">
            {error.message}
          </Text>
        )}

        {resend.isSuccess && !error && (
          <Text className="text-lime font-mono-md text-label-sm tracking-label uppercase mt-4">
            Nowy kod został wysłany
          </Text>
        )}

        <View className="mt-auto pt-10">
          <Button
            label={isSaving ? 'Zapisuję...' : 'Ustaw hasło →'}
            variant="primary"
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>

        <Pressable
          onPress={handleResend}
          disabled={resend.isPending}
          className="mt-8"
        >
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center">
            Nie dostałeś kodu?{' '}
            <Text className="text-fg">{resend.isPending ? 'Wysyłam...' : 'Wyślij ponownie'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
