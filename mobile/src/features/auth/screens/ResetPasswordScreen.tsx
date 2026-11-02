import { useState } from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { AuthStackParamList } from '../../../navigation/types';
import { useConfirmPasswordReset } from '../hooks/useConfirmPasswordReset';
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset';
import { useSignIn } from '../hooks/useSignIn';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthError } from '../components/AuthError';
import { CodeSentNotice } from '../components/CodeSentNotice';
import { ResendCodeLink } from '../components/ResendCodeLink';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { MIN_PASSWORD_LENGTH, VERIFICATION_CODE_LENGTH } from '../credentials';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = ({ route }: Props) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const confirm = useConfirmPasswordReset();
  const resend = useRequestPasswordReset();
  const signIn = useSignIn();

  const error = confirm.error ?? signIn.error ?? resend.error;
  const isSaving = confirm.isPending || signIn.isPending;
  const canSubmit =
    code.length === VERIFICATION_CODE_LENGTH && password.length >= MIN_PASSWORD_LENGTH && !isSaving;

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
    <AuthScreenLayout
      eyebrow="[ NOWE HASŁO ]"
      title="Sprawdź"
      accent="skrzynkę."
      lead={
        <>
          Jeśli <Text className="text-fg">{email}</Text> ma konto, wysłaliśmy na niego 6-cyfrowy
          kod. Wpisz go i ustaw nowe hasło.
        </>
      }
    >
      <View className="gap-4 mt-10">
        <VerificationCodeInput value={code} onChange={setCode} />
        <Input
          label="Nowe hasło"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder={`min. ${MIN_PASSWORD_LENGTH} znaków`}
        />
      </View>

      <AuthError message={error?.message} />

      {resend.isSuccess && !error && <CodeSentNotice />}

      <View className="mt-auto pt-10">
        <Button
          label={isSaving ? 'Zapisuję...' : 'Ustaw hasło →'}
          variant="primary"
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </View>

      <ResendCodeLink isPending={resend.isPending} onPress={handleResend} />
    </AuthScreenLayout>
  );
};
