import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkout } from '../../../api/workouts';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const getToday = () => new Date().toISOString().split('T')[0];

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  const today = getToday();
  return useMutation({
    mutationFn: () =>
      createWorkout({
        userId: USER_ID,
        name: `Trening ${new Date().toLocaleDateString('pl-PL')}`,
        performedAt: today,
        notes: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'by-date', today] });
    },
  });
};
