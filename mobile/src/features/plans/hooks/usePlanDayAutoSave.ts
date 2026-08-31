import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePutApiTrainingPlansDaysDayId,
  getGetApiTrainingPlansDaysDayIdQueryKey,
  getGetApiTrainingPlansPlanIdQueryKey,
} from '../../../api/generated/training-plans/training-plans';
import { PlanDayResponse } from '../../../api/generated/schemas';

type Args = {
  dayId: string;
  day: PlanDayResponse | undefined;
  name: string;
  notes: string;
  delayMs?: number;
};

export const usePlanDayAutoSave = ({ dayId, day, name, notes, delayMs = 600 }: Args) => {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryKey = getGetApiTrainingPlansDaysDayIdQueryKey(dayId);

  const { mutate: update } = usePutApiTrainingPlansDaysDayId({
    mutation: {
      onMutate: async ({ data }) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<PlanDayResponse>(queryKey);
        queryClient.setQueryData<PlanDayResponse>(queryKey, (old) =>
          old ? { ...old, name: data.name, notes: data.notes ?? null } : old,
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        // The plan screen lists day names, so it has to hear about the rename too.
        if (day) {
          queryClient.invalidateQueries({
            queryKey: getGetApiTrainingPlansPlanIdQueryKey(day.planId),
          });
        }
      },
    },
  });

  useEffect(() => {
    if (!day) return;
    if (!name.trim()) return;

    const trimmedNotes = notes.trim() || null;
    const unchanged = name.trim() === day.name && trimmedNotes === (day.notes ?? null);
    if (unchanged) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      update({ dayId, data: { name: name.trim(), notes: trimmedNotes } });
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [name, notes, day, dayId, delayMs, update]);
};
