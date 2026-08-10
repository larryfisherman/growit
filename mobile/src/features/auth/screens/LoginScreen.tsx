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
import { useSignIn } from '../hooks/useSignIn';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = useSignIn();

  const handleSubmit = () => signIn.mutate({ email: email.trim().toLowerCase(), password });

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
            [ LOGOWANIE ]
          </Text>
          <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
            Witaj{'\n'}
            <Text className="text-lime">z powrotem.</Text>
          </Text>
        </View>

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
            onPress={() => {
              /* TODO: forgot password flow */
            }}
          >
            <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-right">
              Nie pamiętam hasła
            </Text>
          </Pressable>
        </View>

        {signIn.error && (
          <Text className="text-danger font-mono-md text-label-sm tracking-label uppercase mt-4">
            {signIn.error.message}
          </Text>
        )}

        {/* primary CTA */}
        <View className="mt-auto pt-10">
          <Button
            label={signIn.isPending ? 'Loguję...' : 'Zaloguj się →'}
            variant="primary"
            onPress={handleSubmit}
            disabled={!email.trim() || !password || signIn.isPending}
          />
        </View>

        {/* social alternatives */}
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

        {/* link to register */}
        <Pressable onPress={() => navigation.replace('Register')} className="mt-8">
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center">
            Nie masz konta? <Text className="text-fg">Zarejestruj się</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
