import { useSyncExternalStore } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';
import { CONNECTION_BANNER_CLEARANCE } from './ConnectionBanner';
import { clearLostWrites, getLostWriteCount, subscribeToLostWrites } from './failedWrites';
import { useFadeSlideIn } from './useFadeSlideIn';

/// Sits below the connection banner and stays until acknowledged.
///
/// Everything else in this app is built so a write can wait as long as it needs to, which
/// makes the rare write that genuinely cannot be saved easy to miss - its optimistic patch
/// is still on screen, looking saved. This is the one place that says otherwise.
export const LostWritesBanner = () => {
  const lost = useSyncExternalStore(subscribeToLostWrites, getLostWriteCount);
  const insets = useSafeAreaInsets();

  const animatedStyle = useFadeSlideIn(lost > 0);

  const explain = () => {
    Alert.alert(
      'Nie udało się zapisać',
      'Część zmian nie została przyjęta przez serwer i nie zostanie ponowiona. To, co widzisz na ekranie, może się różnić od zapisanych danych - odśwież, żeby zobaczyć aktualny stan.',
      [{ text: 'Rozumiem', onPress: clearLostWrites }],
    );
  };

  return (
    <Animated.View
      pointerEvents={lost > 0 ? 'box-none' : 'none'}
      style={[
        {
          position: 'absolute',
          top: insets.top + CONNECTION_BANNER_CLEARANCE,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 100,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={explain}
        style={{
          backgroundColor: tokens.color.danger,
          borderRadius: tokens.radius.pill,
          paddingHorizontal: tokens.space[4],
          paddingVertical: tokens.space[2],
        }}
      >
        <Text style={{ ...tokens.type.labelSm, color: tokens.color.fg }}>
          {lost === 1 ? 'Nie zapisano zmiany' : `Nie zapisano zmian: ${lost}`}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
