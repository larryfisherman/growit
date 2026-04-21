import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTemplate } from '../../../api/templates';

const USER_ID = '00000000-0000-0000-0000-000000000001';

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', USER_ID] });
    },
  });
};
