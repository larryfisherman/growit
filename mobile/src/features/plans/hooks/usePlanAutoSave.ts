import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePutApiTrainingPlansPlanId,
  getGetApiTrainingPlansPlanIdQueryKey,
} from '../../../api/generated/training-plans/training-plans';
import { TrainingPlanResponse } from '../../../api/generated/schemas';

type Args = {
  planId: string | null;
  plan: TrainingPlanResponse | undefined;
  name: string;
  notes: string;
  delayMs?: number;
};

/// Saves the plan header a moment after typing stops, so the screen has no save button.
export const usePlanAutoSave = ({ planId, plan, name, notes, delayMs = 600 }: Args) => {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryKey = planId ? getGetApiTrainingPlansPlanIdQueryKey(planId) : null;

  const { mutate: update } = usePutApiTrainingPlansPlanId({
    mutation: {
      onMutate: async ({ data }) => {
        if (!queryKey) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<TrainingPlanResponse>(queryKey);
        queryClient.setQueryData<TrainingPlanResponse>(queryKey, (old) =>
          old ? { ...old, name: data.name, notes: data.notes ?? null } : old,
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (queryKey && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        if (queryKey) queryClient.invalidateQueries({ queryKey });
      },
    },
  });

  useEffect(() => {
    if (!planId || !plan) return;
    if (!name.trim()) return;

    const trimmedNotes = notes.trim() || null;
    const unchanged = name.trim() === plan.name && trimmedNotes === (plan.notes ?? null);
    if (unchanged) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      update({ planId, data: { name: name.trim(), notes: trimmedNotes } });
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [name, notes, plan, planId, delayMs, update]);
};
