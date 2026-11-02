import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { AuthStackParamList } from '../../../navigation/types';
import { useSignIn } from '../hooks/useSignIn';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthError } from '../components/AuthError';
import { normalizeEmail } from '../credentials';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = useSignIn();

  const handleSubmit = () => signIn.mutate({ email: normalizeEmail(email), password });

  return (
    <AuthScreenLayout eyebrow="[ LOGOWANIE ]" title="Witaj" accent="z powrotem.">
      {/* form */}
      <View className="gap-4 mt-10">
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
          autoComplete="password"
          placeholder="••••••••"
        />
        <Pressable
          onPress={() =>
            navigation.navigate('ForgotPassword', { email: normalizeEmail(email) || undefined })
          }
        >
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-right">
            Nie pamiętam hasła
          </Text>
        </Pressable>
      </View>

      <AuthError message={signIn.error?.message} />

      {/* primary CTA */}
      <View className="mt-auto pt-10">
        <Button
          label={signIn.isPending ? 'Loguję...' : 'Zaloguj się →'}
          variant="primary"
          onPress={handleSubmit}
          disabled={!email.trim() || !password || signIn.isPending}
        />
      </View>

      {/* link to register */}
      <Pressable onPress={() => navigation.replace('Register')} className="mt-8">
        <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center">
          Nie masz konta? <Text className="text-fg">Zarejestruj się</Text>
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
};
