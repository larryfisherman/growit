import { useState } from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { AuthStackParamList } from '../../../navigation/types';
import { useConfirmSignUp } from '../hooks/useConfirmSignUp';
import { useResendConfirmationCode } from '../hooks/useResendConfirmationCode';
import { useSignIn } from '../hooks/useSignIn';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthError } from '../components/AuthError';
import { CodeSentNotice } from '../components/CodeSentNotice';
import { ResendCodeLink } from '../components/ResendCodeLink';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { VERIFICATION_CODE_LENGTH } from '../credentials';

type Props = NativeStackScreenProps<AuthStackParamList, 'ConfirmSignUp'>;

export const ConfirmSignUpScreen = ({ route, navigation }: Props) => {
  const { email, password } = route.params;
  const [code, setCode] = useState('');

  const confirm = useConfirmSignUp();
  const resend = useResendConfirmationCode();
  const signIn = useSignIn();

  const error = confirm.error ?? signIn.error ?? resend.error;
  const isConfirming = confirm.isPending || signIn.isPending;

  const handleConfirm = () =>
    confirm.mutate(
      { email, code },
      {
        onSuccess: () =>
          password ? signIn.mutate({ email, password }) : navigation.replace('Login'),
      },
    );

  return (
    <AuthScreenLayout
      eyebrow="[ POTWIERDZENIE ]"
      title="Sprawdź"
      accent="skrzynkę."
      lead={
        <>
          Wysłaliśmy 6-cyfrowy kod na <Text className="text-fg">{email}</Text>. Wpisz go poniżej.
        </>
      }
    >
      <View className="mt-10">
        <VerificationCodeInput value={code} onChange={setCode} />
      </View>

      <AuthError message={error?.message} />

      {resend.isSuccess && !error && <CodeSentNotice />}

      <View className="mt-auto pt-10">
        <Button
          label={isConfirming ? 'Potwierdzam...' : 'Potwierdź →'}
          variant="primary"
          onPress={handleConfirm}
          disabled={code.length !== VERIFICATION_CODE_LENGTH || isConfirming}
        />
      </View>

      <ResendCodeLink isPending={resend.isPending} onPress={() => resend.mutate(email)} />
    </AuthScreenLayout>
  );
};
