import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TodayStackParamList } from '../../../navigation/types';
import {
  useGetApiWorkoutsUserIdByDate,
  useGetApiWorkoutsUserIdHistory,
  usePostApiWorkouts,
  getGetApiWorkoutsUserIdByDateQueryKey,
} from '../../../api/generated/workouts/workouts';
import { WorkoutSummaryResponse } from '../../../api/generated/schemas';
import { Button } from '../../../theme/components/Button';
import { tokens } from '../../../theme/tokens';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const USER_NAME = 'Albert';
const getToday = () => new Date().toISOString().split('T')[0];

const formatTodayHeader = () =>
  new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

const formatWorkoutDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
};

const exerciseCountLabel = (n: number) => {
  if (n === 0) return 'Brak ćwiczeń';
  if (n === 1) return '1 ćwiczenie';
  if (n >= 2 && n <= 4) return `${n} ćwiczenia`;
  return `${n} ćwiczeń`;
};

const LastWorkoutCard = ({
  workout,
  onPress,
}: {
  workout: WorkoutSummaryResponse;
  onPress: () => void;
}) => (
  <Pressable
    className="bg-surface rounded-md p-4 border border-line"
    onPress={onPress}
  >
    <Text className="text-fg font-sans-sb text-body-lg">{workout.name}</Text>
    <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
      {workout.templateName ? `Z szablonu · ${workout.templateName}` : 'Bez szablonu'}
    </Text>
    <Text className="text-muted font-sans-md text-body-sm mt-2">
      {formatWorkoutDate(workout.performedAt)} · {exerciseCountLabel(workout.exerciseCount)}
    </Text>
  </Pressable>
);

export const WorkoutsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TodayStackParamList>>();
  const queryClient = useQueryClient();
  const today = getToday();

  const { data: workout, isLoading } = useGetApiWorkoutsUserIdByDate(
    USER_ID,
    { date: today },
    { query: { retry: false } }
  );
  const { data: history } = useGetApiWorkoutsUserIdHistory(USER_ID, { page: 1, pageSize: 2 });

  const { mutate: createWorkout, isPending } = usePostApiWorkouts({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: getGetApiWorkoutsUserIdByDateQueryKey(USER_ID, { date: today }),
        }),
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  // pick most recent workout that's not today
  const lastWorkout = history?.items.find((w) => w.id !== workout?.id);

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="px-6 pt-6 pb-10 gap-12">
      {/* greeting */}
      <View>
        <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-3">
          [ DZISIAJ ]
        </Text>
        <Text className="text-fg font-sans-b text-h1" style={{ letterSpacing: -1 }}>
          Cześć, <Text className="text-lime">{USER_NAME}</Text> 👋
        </Text>
        <Text className="text-muted font-sans-md text-body-lg mt-2 capitalize">
          {formatTodayHeader()}
        </Text>
      </View>

      {/* today's workout — if exists */}
      {workout && (
        <View className="gap-3">
          <Text className="text-muted font-mono-md text-label tracking-label uppercase">
            [ TWÓJ TRENING ]
          </Text>
          <Pressable
            className="bg-surface rounded-md p-5 border border-line"
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
          >
            <Text className="text-fg font-sans-sb text-h3">{workout.name}</Text>
            {workout.templateName && (
              <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
                Z szablonu · {workout.templateName}
              </Text>
            )}
            <Text className="text-muted font-sans-md text-body-sm mt-2">
              {exerciseCountLabel(workout.exerciseCount)}
            </Text>
          </Pressable>
        </View>
      )}

      {/* start options — only when no workout today */}
      {!workout && (
        <View className="gap-3">
          <Text className="text-muted font-mono-md text-label tracking-label uppercase">
            [ ROZPOCZNIJ ]
          </Text>
          <Button
            label="Rozpocznij z szablonu →"
            variant="primary"
            onPress={() => navigation.navigate('StartFromTemplate')}
          />
          <Button
            label="Pusty trening"
            variant="secondary"
            loading={isPending}
            disabled={isPending}
            onPress={() =>
              createWorkout({
                data: {
                  userId: USER_ID,
                  name: `Trening ${new Date().toLocaleDateString('pl-PL')}`,
                  performedAt: today,
                  notes: null,
                },
              })
            }
          />
        </View>
      )}

      {/* last workout — informational */}
      {lastWorkout && (
        <View className="gap-3">
          <Text className="text-muted font-mono-md text-label tracking-label uppercase">
            [ OSTATNI TRENING ]
          </Text>
          <LastWorkoutCard
            workout={lastWorkout}
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: lastWorkout.id })}
          />
        </View>
      )}
    </ScrollView>
  );
};
