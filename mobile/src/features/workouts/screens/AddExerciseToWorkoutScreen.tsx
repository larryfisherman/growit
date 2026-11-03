import { FlatList, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { WorkoutSessionParamList } from '../../../navigation/types';
import { useGetApiExercises } from '../../../api/generated/exercises/exercises';
import {
  usePostApiWorkoutsWorkoutIdExercises,
  getGetApiWorkoutsWorkoutIdQueryKey,
} from '../../../api/generated/workouts/workouts';
import { WorkoutResponse } from '../../../api/generated/schemas';
import { ScreenState } from '../../../theme/components/ScreenState';
import { newId } from '../../../offline/ids';
import { isInFlight } from '../../../offline/isInFlight';
import { nextPosition } from '../../../lib/position';

type Props = NativeStackScreenProps<WorkoutSessionParamList, 'AddExerciseToWorkout'>;

export const AddExerciseToWorkoutScreen = ({ route, navigation }: Props) => {
  const { workoutId } = route.params;
  const queryClient = useQueryClient();

  const { data: exercises, isLoading } = useGetApiExercises({
    query: { staleTime: Infinity },
  });

  // The request carries the position, and the client picks it so the row the registry
  // appends to the cached workout sits where the server will store it. The workout is
  // already in cache because the screen we came from rendered it.
  const nextOrderIndex = () => {
    const workout = queryClient.getQueryData<WorkoutResponse>(
      getGetApiWorkoutsWorkoutIdQueryKey(workoutId),
    );
    return nextPosition(workout?.exercises ?? []);
  };
  const addExerciseMutation = usePostApiWorkoutsWorkoutIdExercises();
  const { mutate: addExercise } = addExerciseMutation;
  const isAddingNow = isInFlight(addExerciseMutation);

  if (isLoading) {
    return <ScreenState kind="loading" />;
  }

  return (
    <FlatList
      className="bg-bg"
      data={exercises}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          className="bg-surface rounded-md p-4 border border-line"
          onPress={() => {
            addExercise({
              workoutId,
              data: {
                id: newId(),
                exerciseId: item.id,
                orderIndex: nextOrderIndex(),
                targetSets: null,
                targetReps: null,
                restSeconds: null,
              },
            });
            // Safe to close on the spot: the registry has already appended the row to
            // the cached workout, so the screen behind us shows it whether or not the
            // write has left the device.
            navigation.goBack();
          }}
          disabled={isAddingNow}
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
