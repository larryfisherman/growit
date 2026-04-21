import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeExerciseFromTemplate } from '../../../api/templates';

export const useRemoveExerciseFromTemplate = (templateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateExerciseId: string) => {
      console.log('[delete] calling DELETE for', templateExerciseId);
      return removeExerciseFromTemplate(templateExerciseId);
    },
    onSuccess: () => {
      console.log('[delete] success');
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
    onError: (e) => {
      console.log('[delete] error', e);
    },
  });
};
