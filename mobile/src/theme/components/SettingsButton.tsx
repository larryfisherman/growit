// Header button opening the settings modal. Lives on the root screen of every tab,
// so it is defined once and passed as `headerRight`.

import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { tokens } from '../tokens';

export const SettingsButton = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() => navigation.navigate('Settings')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Ustawienia"
      className="w-9 h-9 rounded-pill border border-line-strong items-center justify-center"
    >
      <Ionicons name="settings-outline" size={18} color={tokens.color.fg} />
    </Pressable>
  );
};
