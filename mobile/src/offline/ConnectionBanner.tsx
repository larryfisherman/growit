import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';
import { useConnectivity } from './useConnectivity';

type Variant = 'offline' | 'unstable' | 'restored';

/// A connection wobbling around the threshold would otherwise flash the banner on and
/// off; 'unstable' has to hold for this long before it is worth saying.
const UNSTABLE_DELAY_MS = 3_000;
const RESTORED_VISIBLE_MS = 2_000;

/// Announcing recovery only makes sense if the user had time to notice the outage.
const MIN_OUTAGE_TO_ANNOUNCE_MS = 3_000;

const copy: Record<Variant, { label: string; color: string; ink: string }> = {
  offline: { label: 'Tryb offline', color: tokens.color.surface2, ink: tokens.color.fg },
  unstable: { label: 'Niestabilne połączenie', color: tokens.color.warning, ink: tokens.color.bg },
  restored: { label: 'Połączono ponownie', color: tokens.color.success, ink: tokens.color.bg },
};

export const ConnectionBanner = () => {
  const status = useConnectivity();
  const insets = useSafeAreaInsets();
  const [variant, setVariant] = useState<Variant | null>(null);
  const outageStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'offline') {
      outageStartedAt.current ??= Date.now();
      setVariant('offline');
      return;
    }

    if (status === 'unstable') {
      outageStartedAt.current ??= Date.now();
      const timer = setTimeout(() => setVariant('unstable'), UNSTABLE_DELAY_MS);
      return () => clearTimeout(timer);
    }

    const startedAt = outageStartedAt.current;
    outageStartedAt.current = null;

    if (startedAt === null || Date.now() - startedAt < MIN_OUTAGE_TO_ANNOUNCE_MS) {
      setVariant(null);
      return;
    }

    setVariant('restored');
    const timer = setTimeout(() => setVariant(null), RESTORED_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  // Keep the last variant while fading out, so the banner does not blank mid-animation.
  const shown = useRef<Variant>('offline');
  if (variant) shown.current = variant;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(variant ? 1 : 0, { duration: 220 });
  }, [variant, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -12 }],
  }));

  const { label, color, ink } = copy[shown.current];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 100,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: color,
          borderRadius: tokens.radius.pill,
          paddingHorizontal: tokens.space[4],
          paddingVertical: tokens.space[2],
        }}
      >
        <Text style={{ ...tokens.type.labelSm, color: ink }}>{label}</Text>
      </View>
    </Animated.View>
  );
};
