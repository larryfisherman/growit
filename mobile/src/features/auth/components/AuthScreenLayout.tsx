import { ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../../theme/components/BackButton';
import { SectionLabel } from '../../../theme/components/SectionLabel';

/// The shell every auth form screen shares: a keyboard-aware scroll view, the back button,
/// and the hero (bracketed eyebrow, two-line title whose second line is lime, optional lead).
/// Children follow the hero and carry the form, errors and CTAs in the screen's own order.
export const AuthScreenLayout = ({
  eyebrow,
  title,
  accent,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  lead?: ReactNode;
  children: ReactNode;
}) => (
  <SafeAreaView className="flex-1 bg-bg">
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-7 pb-7 grow"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <View className="mt-4">
        <BackButton />
      </View>

      <View className="mt-16">
        <SectionLabel className="mb-4">{eyebrow}</SectionLabel>
        <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
          {title}
          {'\n'}
          <Text className="text-lime">{accent}</Text>
        </Text>
        {lead && <Text className="text-muted font-sans-md text-body mt-4">{lead}</Text>}
      </View>

      {children}
    </ScrollView>
  </SafeAreaView>
);
