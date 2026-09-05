import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Button } from '../../../theme/components/Button';
import { useAuth } from '../../../auth/AuthContext';
import { forceOffline, isForcedOffline } from '../../../offline/connectivity';
import { tokens } from '../../../theme/tokens';

/// Flips the same flag the circuit breaker uses, so the offline path under test is the
/// one that ships - no radio, no simulator settings.
const OfflineSimulator = () => {
  const [enabled, setEnabled] = useState(isForcedOffline);

  const toggle = (next: boolean) => {
    setEnabled(next);
    forceOffline(next);
  };

  return (
    <>
      <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-3 mt-8">
        [ DEWELOPERSKIE ]
      </Text>

      <View className="bg-surface rounded-md p-4 border border-line flex-row items-center justify-between">
        <Text className="text-fg font-sans-md text-body">Symuluj tryb offline</Text>
        <Switch
          value={enabled}
          onValueChange={toggle}
          trackColor={{ false: tokens.color.surface2, true: tokens.color.lime }}
          thumbColor={tokens.color.fg}
        />
      </View>
    </>
  );
};

export const SettingsScreen = () => {
  const { email, signOut } = useAuth();

  return (
    <View className="flex-1 bg-bg px-6 pt-6 pb-10">
      <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-3">
        [ KONTO ]
      </Text>

      <View className="bg-surface rounded-md p-4 border border-line">
        <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">Email</Text>
        <Text className="text-fg font-sans-md text-body-lg mt-1">{email}</Text>
      </View>

      {__DEV__ && <OfflineSimulator />}

      <View className="mt-auto">
        <Button label="Wyloguj się" variant="secondary" onPress={signOut} />
      </View>
    </View>
  );
};
