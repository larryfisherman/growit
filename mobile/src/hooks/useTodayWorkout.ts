import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { TodayWorkout } from '../api/types';

const USER_ID = '00000000-0000-0000-0000-000000000001';

const getToday = () => new Date().toISOString().split('T')[0];

export const useTodayWorkout = () => {
  const today = getToday();
  return useQuery({
    queryKey: ['workout', 'by-date', today],
    queryFn: () => apiFetch<TodayWorkout>(`/api/workouts/${USER_ID}/by-date?date=${today}`),
  });
};

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  const today = getToday();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>('/api/workouts', {
        method: 'POST',
        body: JSON.stringify({
          userId: USER_ID,
          name: `Trening ${new Date().toLocaleDateString('pl-PL')}`,
          performedAt: today,
          notes: null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'by-date', today] });
    },
  });
};
