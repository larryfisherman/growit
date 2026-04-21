import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addExerciseToTemplate } from '../../../api/templates';

export const useAddExerciseToTemplate = (templateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      exerciseId: string | null;
      customExerciseName: string | null;
      targetSets: number;
      targetReps: number;
      restSeconds: number;
    }) => addExerciseToTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
  });
};
