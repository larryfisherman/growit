import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addExerciseToWorkout } from '../../../api/workouts';

export const useAddExerciseToWorkout = (workoutId: string, onSuccess: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => addExerciseToWorkout(workoutId, exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
      onSuccess();
    },
  });
};
