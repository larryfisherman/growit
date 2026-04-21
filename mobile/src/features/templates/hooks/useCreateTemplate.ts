import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTemplate } from '../../../api/templates';

const USER_ID = '00000000-0000-0000-0000-000000000001';

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; notes: string | null }) =>
      createTemplate({ userId: USER_ID, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', USER_ID] });
    },
  });
};
