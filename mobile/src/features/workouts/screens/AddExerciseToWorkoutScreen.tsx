import { View, FlatList, Text, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TodayStackParamList } from '../../../navigation/types';
import { useGetApiExercises } from '../../../api/generated/exercises/exercises';
import {
  usePostApiWorkoutsWorkoutIdExercises,
  getGetApiWorkoutsWorkoutIdQueryKey,
} from '../../../api/generated/workouts/workouts';
import { tokens } from '../../../theme/tokens';

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
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  return (
    <FlatList
      className="bg-bg"
      data={exercises}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          className="bg-surface rounded-md p-4 border border-line"
          onPress={() => addExercise({ workoutId, data: { exerciseId: item.id } })}
          disabled={isPending}
        >
          <Text className="text-fg font-sans-sb text-body-lg">{item.name}</Text>
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
            {item.category}
          </Text>
        </Pressable>
      )}
      contentContainerClassName="p-4 gap-2"
    />
  );
};
