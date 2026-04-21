import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTemplate } from '../../../api/templates';

const USER_ID = '00000000-0000-0000-0000-000000000001';

export const useUpdateTemplate = (templateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; notes: string | null }) => updateTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates', USER_ID] });
    },
  });
};
