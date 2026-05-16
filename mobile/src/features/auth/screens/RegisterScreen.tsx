import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { AuthStackParamList } from '../../../navigation/AuthStack';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  const handleSubmit = () => {
    // TODO: hook up to backend auth when ready
    console.log('register', { name, email, password });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-7 pb-7 grow"
          keyboardShouldPersistTaps="handled"
        >
          {/* logo mark + wordmark */}
          <View className="flex-row items-center gap-2 mt-4">
            <View
              className="w-3 h-3 bg-lime rounded-sm"
              style={{ transform: [{ rotate: '45deg' }] }}
            />
            <Text className="text-fg font-sans-b text-base tracking-tight">growit</Text>
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
              placeholder="Jak ci mówić?"
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

          {/* CTAs */}
          <View className="gap-2 mt-auto pt-10">
            <Button
              label="Załóż konto →"
              variant="primary"
              onPress={handleSubmit}
              disabled={!canSubmit}
            />
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center mt-3">
                Masz już konto?{' '}
                <Text className="text-fg">Zaloguj się</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
