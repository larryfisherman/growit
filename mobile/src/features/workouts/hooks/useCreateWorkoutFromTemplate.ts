import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkoutFromTemplate } from '../../../api/workouts';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const getToday = () => new Date().toISOString().split('T')[0];

export const useCreateWorkoutFromTemplate = () => {
  const queryClient = useQueryClient();
  const today = getToday();
  return useMutation({
    mutationFn: (templateId: string) =>
      createWorkoutFromTemplate({ userId: USER_ID, templateId, performedAt: today }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'by-date', today] });
    },
  });
};
