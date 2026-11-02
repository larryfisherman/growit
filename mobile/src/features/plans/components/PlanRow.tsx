import { View, Text, Pressable, Alert } from 'react-native';
import { TrainingPlanSummaryResponse } from '../../../api/generated/schemas';
import { SwipeToDelete } from '../../../theme/components/SwipeToDelete';
import { dayCountLabel } from '../../../lib/plurals';

type RowProps = {
  plan: TrainingPlanSummaryResponse;
  onPress: () => void;
  onDelete: () => void;
};

/// One plan in the plans list. Tap to open it, swipe left to delete it after a confirm.
export const PlanRow = ({ plan, onPress, onDelete }: RowProps) => {
  const confirmDelete = () => {
    Alert.alert('Usuń plan', `Na pewno usunąć „${plan.name}"? Dni planu znikną razem z nim.`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <SwipeToDelete inset onDelete={confirmDelete}>
      <Pressable onPress={onPress} className="bg-bg px-4 py-4 border-b border-line">
        <View className="flex-row items-center gap-2">
          <Text className="text-fg font-sans-sb text-body-lg">{plan.name}</Text>
          {plan.isActive && (
            <Text className="text-lime-ink bg-lime rounded-pill px-2 py-0.5 font-mono-md text-label-sm tracking-label uppercase">
              aktywny
            </Text>
          )}
        </View>
        <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
          {dayCountLabel(plan.dayCount)}
        </Text>
      </Pressable>
    </SwipeToDelete>
  );
};
