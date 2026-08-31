import { useQueryClient } from '@tanstack/react-query';
import {
  usePutApiTrainingPlansExercisesPlanDayExerciseId,
  getGetApiTrainingPlansDaysDayIdQueryKey,
} from '../../../api/generated/training-plans/training-plans';
import { PlanDayResponse } from '../../../api/generated/schemas';

export const usePlanDayExerciseUpdate = (dayId: string) => {
  const queryClient = useQueryClient();
  const queryKey = getGetApiTrainingPlansDaysDayIdQueryKey(dayId);

  return usePutApiTrainingPlansExercisesPlanDayExerciseId({
    mutation: {
      onMutate: async ({ planDayExerciseId, data }) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<PlanDayResponse>(queryKey);
        queryClient.setQueryData<PlanDayResponse>(queryKey, (old) =>
          old
            ? {
                ...old,
                exercises: old.exercises.map((e) =>
                  e.id === planDayExerciseId
                    ? {
                        ...e,
                        targetSets: data.targetSets,
                        targetReps: data.targetReps,
                        restSeconds: data.restSeconds,
                        orderIndex: data.orderIndex,
                      }
                    : e,
                ),
              }
            : old,
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
