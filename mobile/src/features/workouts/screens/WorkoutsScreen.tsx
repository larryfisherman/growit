import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TodayStackParamList } from '../../../navigation/types';
import {
  useGetApiWorkoutsUserIdByDate,
  usePostApiWorkouts,
  getGetApiWorkoutsUserIdByDateQueryKey,
} from '../../../api/generated/workouts/workouts';
import { Button } from '../../../theme/components/Button';
import { tokens } from '../../../theme/tokens';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const getToday = () => new Date().toISOString().split('T')[0];

export const WorkoutsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TodayStackParamList>>();
  const queryClient = useQueryClient();
  const today = getToday();

  const { data: workout, isLoading } = useGetApiWorkoutsUserIdByDate(
    USER_ID,
    { date: today },
    { query: { retry: false } }
  );
  const { mutate: createWorkout, isPending } = usePostApiWorkouts({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: getGetApiWorkoutsUserIdByDateQueryKey(USER_ID, { date: today }),
        }),
    },
  });

  const todayLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg p-6">
      <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-2">
        [ DZISIAJ ]
      </Text>
      <Text className="text-fg font-sans-b text-h1 capitalize" style={{ letterSpacing: -1 }}>
        {todayLabel}
      </Text>

      {workout ? (
        <Pressable
          className="bg-surface rounded-md p-5 border border-line mt-8"
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
        >
          <Text className="text-fg font-sans-sb text-h3">{workout.name}</Text>
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-2">
            {workout.exerciseCount === 0
              ? 'Brak ćwiczeń'
              : `${workout.exerciseCount} ćwiczenie${workout.exerciseCount > 1 ? 'ń' : ''}`}
          </Text>
        </Pressable>
      ) : (
        <View className="gap-3 mt-8">
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
    </View>
  );
};
