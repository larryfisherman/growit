import { useQuery } from '@tanstack/react-query';
import { getWorkoutByDate } from '../../../api/workouts';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const getToday = () => new Date().toISOString().split('T')[0];

export const useTodayWorkout = () => {
  const today = getToday();
  return useQuery({
    queryKey: ['workout', 'by-date', today],
    queryFn: () => getWorkoutByDate(USER_ID, today),
  });
};
