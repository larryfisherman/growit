import { useQueryClient } from '@tanstack/react-query';
import {
  usePutApiTemplatesExercisesTemplateExerciseId,
  getGetApiTemplatesTemplateIdQueryKey,
} from '../../../api/generated/templates/templates';
import { TemplateResponse } from '../../../api/generated/schemas';

export const useTemplateExerciseUpdate = (templateId: string) => {
  const queryClient = useQueryClient();
  const queryKey = getGetApiTemplatesTemplateIdQueryKey(templateId);

  return usePutApiTemplatesExercisesTemplateExerciseId({
    mutation: {
      onMutate: async ({ templateExerciseId, data }) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<TemplateResponse>(queryKey);
        queryClient.setQueryData<TemplateResponse>(queryKey, (old) =>
          old
            ? {
                ...old,
                exercises: old.exercises.map((e) =>
                  e.id === templateExerciseId
                    ? {
                        ...e,
                        targetSets: data.targetSets,
                        targetReps: data.targetReps,
                        restSeconds: data.restSeconds,
                        orderIndex: data.orderIndex,
                      }
                    : e
                ),
              }
            : old
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
