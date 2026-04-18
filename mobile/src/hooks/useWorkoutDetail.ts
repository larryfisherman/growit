import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { WorkoutDetail } from '../api/types';

export const useWorkoutDetail = (workoutId: string) =>
  useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => apiFetch<WorkoutDetail>(`/api/workouts/${workoutId}`),
  });
