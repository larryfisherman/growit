import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { BackButton } from '../../../theme/components/BackButton';
import { AuthStackParamList } from '../../../navigation/AuthStack';
import { useConfirmSignUp } from '../hooks/useConfirmSignUp';
import { useResendConfirmationCode } from '../hooks/useResendConfirmationCode';
import { useSignIn } from '../hooks/useSignIn';

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
            [ POTWIERDZENIE ]
          </Text>
          <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
            Sprawdź{'\n'}
            <Text className="text-lime">skrzynkę.</Text>
          </Text>
          <Text className="text-muted font-sans-md text-body mt-4">
            Wysłaliśmy 6-cyfrowy kod na <Text className="text-fg">{email}</Text>. Wpisz go poniżej.
          </Text>
        </View>

        <View className="mt-10">
          <Input
            label="Kod weryfikacyjny"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
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
            label={isConfirming ? 'Potwierdzam...' : 'Potwierdź →'}
            variant="primary"
            onPress={handleConfirm}
            disabled={code.length !== 6 || isConfirming}
          />
        </View>

        <Pressable
          onPress={() => resend.mutate(email)}
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
