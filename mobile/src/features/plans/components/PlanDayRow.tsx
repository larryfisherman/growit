import { View, Text, Pressable } from 'react-native';
import { exerciseCountLabel } from '../../../lib/plurals';

type Props = {
  name: string;
  exerciseCount: number;
  position: number;
  onPress: () => void;
  disabled?: boolean;
};

/// One numbered day of a plan: its position in the rotation, its name and how many
/// exercises it holds. Shared by the plan editor and the start-from-plan-day picker.
export const PlanDayRow = ({ name, exerciseCount, position, onPress, disabled }: Props) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className="bg-surface rounded-md p-4 border border-line flex-row items-center gap-3"
  >
    <Text className="text-lime font-mono-md text-label tracking-label">{position}</Text>
    <View className="flex-1">
      <Text className="text-fg font-sans-sb text-body-lg">{name}</Text>
      <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
        {exerciseCountLabel(exerciseCount)}
      </Text>
    </View>
  </Pressable>
);
