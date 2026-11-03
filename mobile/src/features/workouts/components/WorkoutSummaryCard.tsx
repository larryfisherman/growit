import { Pressable, Text } from 'react-native';
import { WorkoutSummaryResponse } from '../../../api/generated/schemas';
import { formatDayMonth } from '../../../lib/date';
import { exerciseCountLabel } from '../../../lib/plurals';

/// One past session as a tappable card: its name, where it came from and when. Shared by
/// the today screen (the last workout) and the calendar list, so both look the same.
export const WorkoutSummaryCard = ({
  workout,
  onPress,
}: {
  workout: WorkoutSummaryResponse;
  onPress: () => void;
}) => (
  <Pressable className="bg-surface rounded-md p-4 border border-line" onPress={onPress}>
    <Text className="text-fg font-sans-sb text-body-lg">{workout.name}</Text>
    <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
      {workout.planDayName ? `Z planu · ${workout.planDayName}` : 'Poza planem'}
    </Text>
    <Text className="text-muted font-sans-md text-body-sm mt-2">
      {formatDayMonth(workout.performedAt)} · {exerciseCountLabel(workout.exerciseCount)}
    </Text>
  </Pressable>
);
