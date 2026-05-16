// mobile/src/features/auth/screens/WelcomeScreen.tsx
// First screen the user sees after launching GrowIt.
// Built from theme tokens + Button + Chip — fully reusable system.

import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../../theme/components/Button';
import { AuthStackParamList } from '../../../navigation/AuthStack';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-7 pb-7">
        {/* logo mark + wordmark */}
        <View className="flex-row items-center gap-2 mt-4">
          <View
            className="w-3 h-3 bg-lime rounded-sm"
            style={{ transform: [{ rotate: '45deg' }] }}
          />
          <Text className="text-fg font-sans-b text-base tracking-tight">
            growit
          </Text>
        </View>

        {/* version tag (top-right, absolute) */}
        <View className="absolute right-7 top-12 items-end">
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">
            v0.1.0
          </Text>
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">
            EST. 2026
          </Text>
        </View>

        {/* hero — vertically centered */}
        <View className="flex-1 justify-center">
          <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-4">
            [ STRENGTH · TRAINING · LOG ]
          </Text>

          <Text className="text-fg font-sans-b text-display" style={{ letterSpacing: -2 }}>
            Twój trening,{'\n'}
            <Text className="text-lime">spisany</Text> jak należy.
          </Text>

          <Text className="text-fg font-sans-sb text-h2 mt-6 max-w-[320px]">
            Bez <Text className="text-lime">Excela</Text> w kieszeni.
          </Text>
        </View>

        {/* CTAs */}
        <View className="gap-2">
          <Button
            label="Zacznij za darmo →"
            variant="primary"
            onPress={() => navigation.navigate('Register')}
          />
          <Button
            label="Mam już konto"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase text-center mt-2">
            By continuing you accept the terms
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};
