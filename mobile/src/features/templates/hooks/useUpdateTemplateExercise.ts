import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTemplateExercise } from '../../../api/templates';

export const useUpdateTemplateExercise = (templateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateExerciseId,
      ...data
    }: {
      templateExerciseId: string;
      targetSets: number;
      targetReps: number;
      restSeconds: number;
      orderIndex: number;
    }) => updateTemplateExercise(templateExerciseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
  });
};
