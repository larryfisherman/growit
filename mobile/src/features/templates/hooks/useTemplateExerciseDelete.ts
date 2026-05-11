import { useQueryClient } from '@tanstack/react-query';
import {
  useDeleteApiTemplatesExercisesTemplateExerciseId,
  getGetApiTemplatesTemplateIdQueryKey,
} from '../../../api/generated/templates/templates';
import { TemplateResponse } from '../../../api/generated/schemas';

export const useTemplateExerciseDelete = (templateId: string) => {
  const queryClient = useQueryClient();
  const queryKey = getGetApiTemplatesTemplateIdQueryKey(templateId);

  return useDeleteApiTemplatesExercisesTemplateExerciseId({
    mutation: {
      onMutate: async ({ templateExerciseId }) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<TemplateResponse>(queryKey);
        queryClient.setQueryData<TemplateResponse>(queryKey, (old) =>
          old ? { ...old, exercises: old.exercises.filter((e) => e.id !== templateExerciseId) } : old
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
    },
  });
};
