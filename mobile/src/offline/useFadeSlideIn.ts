import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/// The enter/leave animation shared by the floating status banners: fades in while
/// sliding down 12pt, and reverses when `visible` turns false. Spread the returned
/// style onto an Animated.View.
export const useFadeSlideIn = (visible: boolean) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [visible, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -12 }],
  }));
};
