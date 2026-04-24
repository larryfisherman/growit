import { View, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TodayStackParamList } from '../../../navigation/types';
import { useGetApiExercises } from '../../../api/generated/exercises/exercises';
import {
  usePostApiWorkoutsWorkoutIdExercises,
  getGetApiWorkoutsWorkoutIdQueryKey,
} from '../../../api/generated/workouts/workouts';

type Props = NativeStackScreenProps<TodayStackParamList, 'AddExerciseToWorkout'>;

export const AddExerciseToWorkoutScreen = ({ route, navigation }: Props) => {
  const { workoutId } = route.params;
  const queryClient = useQueryClient();

  const { data: exercises, isLoading } = useGetApiExercises({
    query: { staleTime: Infinity },
  });
  const { mutate: addExercise, isPending } = usePostApiWorkoutsWorkoutIdExercises({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiWorkoutsWorkoutIdQueryKey(workoutId),
        });
        navigation.goBack();
      },
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={exercises}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          className="bg-gray-100 rounded-lg px-4 py-3"
          onPress={() => addExercise({ workoutId, data: { exerciseId: item.id } })}
          disabled={isPending}
        >
          <Text className="text-base font-semibold">{item.name}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{item.category}</Text>
        </TouchableOpacity>
      )}
      contentContainerClassName="p-4 gap-2"
    />
  );
};
