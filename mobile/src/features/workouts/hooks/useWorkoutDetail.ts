import { useQuery } from '@tanstack/react-query';
import { getWorkoutById } from '../../../api/workouts';

export const useWorkoutDetail = (workoutId: string) =>
  useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => getWorkoutById(workoutId),
  });
