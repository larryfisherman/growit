import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { AuthStackParamList } from '../../../navigation/types';
import { useSignUp } from '../hooks/useSignUp';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthError } from '../components/AuthError';
import { MIN_PASSWORD_LENGTH, normalizeEmail } from '../credentials';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = useSignUp();

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    !signUp.isPending;

  const handleSubmit = () => {
    const trimmedEmail = normalizeEmail(email);
    signUp.mutate(
      { email: trimmedEmail, password, name: name.trim() },
      {
        onSuccess: () =>
          navigation.replace('ConfirmSignUp', {
            email: trimmedEmail,
            password,
          }),
      },
    );
  };

  return (
    <AuthScreenLayout eyebrow="[ REJESTRACJA ]" title="Zacznij" accent="spisywać.">
      {/* form */}
      <View className="gap-4 mt-10">
        <Input
          label="Imię"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="given-name"
          placeholder="Jak masz na imię?"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="ty@example.com"
        />
        <Input
          label="Hasło"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          placeholder={`min. ${MIN_PASSWORD_LENGTH} znaków`}
        />
      </View>

      <AuthError message={signUp.error?.message} />

      <View className="mt-auto pt-10">
        <Button
          label={signUp.isPending ? 'Zakładam konto...' : 'Załóż konto →'}
          variant="primary"
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </View>

      {/* link to login */}
      <Pressable onPress={() => navigation.replace('Login')} className="mt-8">
        <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center">
          Masz już konto? <Text className="text-fg">Zaloguj się</Text>
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
};
