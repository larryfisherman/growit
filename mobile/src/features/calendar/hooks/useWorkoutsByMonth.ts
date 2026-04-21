import { useQuery } from '@tanstack/react-query';
import { getWorkoutsByMonth } from '../../../api/workouts';

const USER_ID = '00000000-0000-0000-0000-000000000001';

export const useWorkoutsByMonth = (year: number, month: number) =>
  useQuery({
    queryKey: ['workouts-by-month', USER_ID, year, month],
    queryFn: () => getWorkoutsByMonth(USER_ID, year, month),
  });
