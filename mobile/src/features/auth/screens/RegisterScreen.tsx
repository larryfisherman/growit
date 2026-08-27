import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { SocialButton } from '../../../theme/components/SocialButton';
import { Divider } from '../../../theme/components/Divider';
import { BackButton } from '../../../theme/components/BackButton';
import { AuthStackParamList } from '../../../navigation/AuthStack';
import { useSignUp } from '../hooks/useSignUp';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = useSignUp();

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && !signUp.isPending;

  const handleSubmit = () => {
    const trimmedEmail = email.trim().toLowerCase();
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
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-7 pb-7 grow"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        {/* back to welcome */}
        <View className="mt-4">
          <BackButton />
        </View>

        {/* hero */}
        <View className="mt-16">
          <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-4">
            [ REJESTRACJA ]
          </Text>
          <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
            Zacznij{'\n'}
            <Text className="text-lime">spisywać.</Text>
          </Text>
        </View>

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
            placeholder="min. 6 znaków"
          />
        </View>

        {signUp.error && (
          <Text className="text-danger font-mono-md text-label-sm tracking-label uppercase mt-4">
            {signUp.error.message}
          </Text>
        )}

        <View className="mt-auto pt-10">
          <Button
            label={signUp.isPending ? 'Zakładam konto...' : 'Załóż konto →'}
            variant="primary"
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>

        <View className="gap-4 mt-8">
          <Divider label="lub" />
          <View className="gap-2">
            <SocialButton
              provider="apple"
              onPress={() => {
                /* TODO: expo-apple-authentication */
              }}
            />
            <SocialButton
              provider="google"
              onPress={() => {
                /* TODO: expo-auth-session google */
              }}
            />
          </View>
        </View>

        {/* link to login */}
        <Pressable onPress={() => navigation.replace('Login')} className="mt-8">
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center">
            Masz już konto? <Text className="text-fg">Zaloguj się</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
