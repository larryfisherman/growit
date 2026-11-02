import { ReactNode, useRef } from 'react';
import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../tokens';

type Size = 'regular' | 'compact';

type Props = {
  onDelete: () => void;
  /// 'regular' for card-sized rows (plans, plan-day exercises), 'compact' for dense
  /// rows such as logged sets.
  size?: Size;
  /// Pads the action inside the row's own bounds, for full-bleed rows with no gap
  /// around them (the plans list).
  inset?: boolean;
  children: ReactNode;
};

// RectButton is not NativeWind-styled, so the action keeps plain style objects.
const presets: Record<Size, { width: number; radius: number; iconSize: number }> = {
  regular: { width: 72, radius: tokens.radius.lg, iconSize: 22 },
  compact: { width: 56, radius: tokens.radius.md, iconSize: 18 },
};

/// Swipe a row left to reveal a red delete action - the one delete gesture used across
/// the app, so every swipeable row looks and behaves the same.
export const SwipeToDelete = ({ onDelete, size = 'regular', inset = false, children }: Props) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const { width, radius, iconSize } = presets[size];

  const renderRightActions = () => (
    <View
      style={{
        width,
        paddingLeft: tokens.space[2],
        ...(inset ? { paddingRight: tokens.space[2], paddingVertical: tokens.space[2] } : {}),
      }}
    >
      <RectButton
        onPress={() => {
          // Close the row before acting, so a confirm dialog never shows over a row that
          // is still swiped open.
          swipeRef.current?.close();
          onDelete();
        }}
        style={{
          flex: 1,
          backgroundColor: tokens.color.danger,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="trash-outline" size={iconSize} color={tokens.color.fg} />
      </RectButton>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      {children}
    </Swipeable>
  );
};
