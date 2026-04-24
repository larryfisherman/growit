import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TodayStackParamList } from '../../../navigation/types';
import {
  useGetApiWorkoutsUserIdByDate,
  usePostApiWorkouts,
  getGetApiWorkoutsUserIdByDateQueryKey,
} from '../../../api/generated/workouts/workouts';

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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 p-6">
      <Text className="text-xl font-semibold mb-6 capitalize">{todayLabel}</Text>

      {workout ? (
        <TouchableOpacity
          className="bg-gray-100 rounded-xl p-5"
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
        >
          <Text className="text-lg font-semibold">{workout.name}</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {workout.exerciseCount === 0
              ? 'Brak ćwiczeń'
              : `${workout.exerciseCount} ćwiczenie${workout.exerciseCount > 1 ? 'ń' : ''}`}
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="gap-3">
          <TouchableOpacity
            className="bg-black rounded-xl py-4 items-center"
            onPress={() => navigation.navigate('StartFromTemplate')}
          >
            <Text className="text-white text-base font-semibold">Rozpocznij z szablonu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-100 rounded-xl py-4 items-center"
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
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-base font-semibold">Rozpocznij pusty trening</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
