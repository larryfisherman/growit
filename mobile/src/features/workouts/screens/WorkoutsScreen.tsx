import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useGetApiWorkoutsUserIdByDate,
  useGetApiWorkoutsUserIdHistory,
  usePostApiWorkouts,
} from '../../../api/generated/workouts/workouts';
import {
  useGetApiTrainingPlansNextDay,
} from '../../../api/generated/training-plans/training-plans';
import { WorkoutSummaryResponse } from '../../../api/generated/schemas';
import { TodayStackParamList } from '../../../navigation/types';
import { useAuth, useUserId } from '../../../auth/AuthContext';
import { Button } from '../../../theme/components/Button';
import { ScreenState } from '../../../theme/components/ScreenState';
import { SectionLabel } from '../../../theme/components/SectionLabel';
import { newId } from '../../../offline/ids';
import { isInFlight } from '../../../offline/isInFlight';
import { getToday, formatWeekdayDayMonth, formatDayMonth, formatShortDate } from '../../../lib/date';
import { exerciseCountLabel } from '../../../lib/plurals';
import { useStartWorkoutFromPlanDay } from '../hooks/useStartWorkoutFromPlanDay';

const LastWorkoutCard = ({
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

export const WorkoutsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TodayStackParamList>>();
  const userId = useUserId();
  const { name } = useAuth();
  const today = getToday();

  const { data: workout, isLoading } = useGetApiWorkoutsUserIdByDate(
    userId,
    { date: today },
    // 404 means nothing is logged today - an expected answer, not a failure worth retrying.
    { query: { retry: false } },
  );
  const { data: history } = useGetApiWorkoutsUserIdHistory(userId, { page: 1, pageSize: 2 });

  // The endpoint answers 204 when there is no active plan, which axios hands over as
  // an empty string - falsy either way, so the check below covers both.
  const { data: nextDay } = useGetApiTrainingPlansNextDay();

  const createWorkoutMutation = usePostApiWorkouts();
  const { mutate: createWorkout } = createWorkoutMutation;
  const isCreatingNow = isInFlight(createWorkoutMutation);

  const { start, isStartingNow } = useStartWorkoutFromPlanDay();

  // Queries run with networkMode 'online': offline with nothing cached the by-date query
  // is paused rather than loading, so isLoading is false and the start buttons show.
  if (isLoading) {
    return <ScreenState kind="loading" />;
  }

  // The most recent workout other than today's.
  const lastWorkout = history?.items.find((w) => w.id !== workout?.id);

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="px-6 pt-6 pb-10 gap-12">
      {/* Greeting */}
      <View>
        <SectionLabel className="mb-3">
          [ DZISIAJ ]
        </SectionLabel>
        <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
          Cześć{name ? ', ' : ''}
          <Text className="text-lime">{name}</Text> 👋
        </Text>
        <Text className="text-muted font-sans-md text-body-lg mt-2 capitalize">
          {formatWeekdayDayMonth()}
        </Text>
      </View>

      {/* Today's workout, once one has been logged */}
      {workout && (
        <View className="gap-3">
          <SectionLabel>
            [ TWÓJ TRENING ]
          </SectionLabel>
          <Pressable
            className="bg-surface rounded-md p-5 border border-line"
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
          >
            <Text className="text-fg font-sans-sb text-h3">{workout.name}</Text>
            {workout.planDayName && (
              <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
                Z planu · {workout.planDayName}
              </Text>
            )}
            <Text className="text-muted font-sans-md text-body-sm mt-2">
              {exerciseCountLabel(workout.exerciseCount)}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Nothing logged yet: suggest where the plan rotation left off */}
      {!workout && (
        <View className="gap-3">
          <SectionLabel>
            [ ROZPOCZNIJ ]
          </SectionLabel>

          {nextDay ? (
            <>
              <View className="bg-surface rounded-md p-5 border border-line">
                <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">
                  Następny w planie
                </Text>
                <Text className="text-fg font-sans-sb text-h3 mt-1">{nextDay.name}</Text>
                <Text className="text-muted font-sans-md text-body-sm mt-2">
                  {exerciseCountLabel(nextDay.exerciseCount)}
                </Text>
              </View>
              <Button
                label={isStartingNow ? 'Zaczynam...' : `Zacznij ${nextDay.name} →`}
                variant="primary"
                loading={isStartingNow}
                disabled={isStartingNow}
                onPress={() =>
                  navigation.navigate('WorkoutDetail', { workoutId: start(nextDay.id) })
                }
              />
              <Button
                label="Wybierz inny dzień"
                variant="secondary"
                onPress={() => navigation.navigate('StartFromPlanDay')}
              />
            </>
          ) : (
            <Button
              label="Ułóż plan treningowy →"
              variant="primary"
              onPress={() => navigation.navigate('PlanDetail', { planId: null })}
            />
          )}

          <Button
            label="Pusty trening"
            variant="secondary"
            loading={isCreatingNow}
            disabled={isCreatingNow}
            onPress={() =>
              createWorkout({
                data: {
                  id: newId(),
                  name: `Trening ${formatShortDate()}`,
                  performedAt: today,
                  notes: null,
                },
              })
            }
          />
        </View>
      )}

      {/* Last workout, for reference only */}
      {lastWorkout && (
        <View className="gap-3">
          <SectionLabel>
            [ OSTATNI TRENING ]
          </SectionLabel>
          <LastWorkoutCard
            workout={lastWorkout}
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: lastWorkout.id })}
          />
        </View>
      )}
    </ScrollView>
  );
};
