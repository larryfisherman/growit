import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeExerciseFromTemplate } from '../../../api/templates';

export const useRemoveExerciseFromTemplate = (templateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateExerciseId: string) => removeExerciseFromTemplate(templateExerciseId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
  });
};
