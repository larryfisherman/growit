import { View, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../../../navigation/types';
import {
  useGetApiTrainingPlans,
  useGetApiTrainingPlansPlanId,
} from '../../../api/generated/training-plans/training-plans';
import { Button } from '../../../theme/components/Button';
import { ScreenState } from '../../../theme/components/ScreenState';
import { screenStateOf } from '../../../offline/screenStateOf';
import { SectionLabel } from '../../../theme/components/SectionLabel';
import { PlanDayRow } from '../../plans/components/PlanDayRow';
import { useStartWorkoutFromPlanDay } from '../hooks/useStartWorkoutFromPlanDay';

type Props = NativeStackScreenProps<TodayStackParamList, 'StartFromPlanDay'>;

export const StartFromPlanDayScreen = ({ navigation }: Props) => {
  const plansQuery = useGetApiTrainingPlans();
  const plans = plansQuery.data;
  const activePlan = plans?.find((p) => p.isActive) ?? plans?.[0];

  const planQuery = useGetApiTrainingPlansPlanId(activePlan?.id ?? '', {
    query: { enabled: !!activePlan },
  });
  const plan = planQuery.data;

  const { start, isStartingNow } = useStartWorkoutFromPlanDay();

  // Offline with nothing cached, "no plans" would be a lie: say there is no connection.
  // The plan query only counts once there is a plan to load (disabled reads as pending).
  const screenState = screenStateOf(plansQuery) ?? (activePlan ? screenStateOf(planQuery) : null);
  if (screenState) {
    return <ScreenState kind={screenState} />;
  }

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={plan?.days}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          plan ? (
            <SectionLabel className="px-4 pt-4">
              [ {plan.name} ]
            </SectionLabel>
          ) : null
        }
        renderItem={({ item, index }) => (
          <PlanDayRow
            name={item.name}
            exerciseCount={item.exerciseCount}
            position={index + 1}
            onPress={() => navigation.replace('WorkoutDetail', { workoutId: start(item.id) })}
            disabled={isStartingNow}
          />
        )}
        contentContainerClassName="p-4 gap-2"
        ListEmptyComponent={
          <View className="items-center justify-center p-10 gap-4">
            <SectionLabel className="text-center">
              [ {plans?.length ? 'PLAN BEZ DNI' : 'BRAK PLANÓW'} ]
            </SectionLabel>
            <Button
              label={plans?.length ? 'Otwórz plan' : '+ Utwórz plan'}
              variant="primary"
              fullWidth={false}
              onPress={() =>
                navigation.navigate('PlanDetail', { planId: activePlan?.id ?? null })
              }
            />
          </View>
        }
      />
    </View>
  );
};
