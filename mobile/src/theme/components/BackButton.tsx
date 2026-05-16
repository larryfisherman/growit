import { Pressable, PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';

type Props = Omit<PressableProps, 'onPress'> & {
  onPress?: () => void;
};

export const BackButton = ({ onPress, ...rest }: Props) => {
  const navigation = useNavigation();
  const handlePress = onPress ?? (() => navigation.goBack());

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      hitSlop={12}
      className="w-10 h-10 items-center justify-center -ml-2"
    >
      <Ionicons name="chevron-back" size={26} color={tokens.color.fg} />
    </Pressable>
  );
};
