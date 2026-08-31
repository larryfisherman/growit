import { useQueryClient } from '@tanstack/react-query';
import {
  useDeleteApiTrainingPlansExercisesPlanDayExerciseId,
  getGetApiTrainingPlansDaysDayIdQueryKey,
  getGetApiTrainingPlansPlanIdQueryKey,
} from '../../../api/generated/training-plans/training-plans';
import { PlanDayResponse } from '../../../api/generated/schemas';

export const usePlanDayExerciseDelete = (dayId: string, planId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = getGetApiTrainingPlansDaysDayIdQueryKey(dayId);

  return useDeleteApiTrainingPlansExercisesPlanDayExerciseId({
    mutation: {
      onMutate: async ({ planDayExerciseId }) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<PlanDayResponse>(queryKey);
        queryClient.setQueryData<PlanDayResponse>(queryKey, (old) =>
          old ? { ...old, exercises: old.exercises.filter((e) => e.id !== planDayExerciseId) } : old,
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        // The plan screen shows an exercise count per day.
        if (planId) {
          queryClient.invalidateQueries({ queryKey: getGetApiTrainingPlansPlanIdQueryKey(planId) });
        }
      },
    },
  });
};
