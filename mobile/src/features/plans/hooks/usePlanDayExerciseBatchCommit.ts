import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  postApiTrainingPlansDaysDayIdExercises,
  deleteApiTrainingPlansExercisesPlanDayExerciseId,
  getGetApiTrainingPlansDaysDayIdQueryKey,
  getGetApiTrainingPlansPlanIdQueryKey,
} from '../../../api/generated/training-plans/training-plans';
import { PlanDayExerciseResponse } from '../../../api/generated/schemas';
import { DEFAULT_TARGETS } from '../constants';

type BatchState = {
  selectedIds: Set<string>;
  customNames: string[];
  existingByExerciseId: Map<string, PlanDayExerciseResponse>;
};

type Args = {
  dayId: string;
  planId: string;
  getState: () => BatchState;
};

const withDefaults = (exerciseId: string | null, customExerciseName: string | null) => ({
  exerciseId,
  customExerciseName,
  targetSets: DEFAULT_TARGETS.sets,
  targetReps: DEFAULT_TARGETS.reps,
  restSeconds: DEFAULT_TARGETS.restSeconds,
});

// Batches the picker's add/remove into a single flush - fired when leaving the
// screen (see PlanDayExercisePickerScreen) and when the app is backgrounded, so
// tapping around never spams the API. Returns the commit function.
export const usePlanDayExerciseBatchCommit = ({ dayId, planId, getState }: Args) => {
  const queryClient = useQueryClient();

  // Listeners fire outside render, so read the freshest state through a ref.
  const stateRef = useRef(getState);
  stateRef.current = getState;

  const persistedIdsRef = useRef<Set<string> | null>(null);
  const sentCustomsRef = useRef<Set<string>>(new Set());
  const newRowIdsRef = useRef<Map<string, string>>(new Map());
  const inFlightRef = useRef(false);

  const commit = useCallback(
    async (reason: string) => {
      const { selectedIds, customNames, existingByExerciseId } = stateRef.current();

      // First commit seeds the baseline from whatever was already on the day.
      persistedIdsRef.current ??= new Set(existingByExerciseId.keys());
      const persisted = persistedIdsRef.current;

      const toAddIds = [...selectedIds].filter((id) => !persisted.has(id));
      const toDeleteIds = [...persisted].filter((id) => !selectedIds.has(id));
      const toAddCustoms = customNames.filter((name) => !sentCustomsRef.current.has(name));

      if (toAddIds.length === 0 && toDeleteIds.length === 0 && toAddCustoms.length === 0) {
        console.log(`[picker] commit skipped (empty diff) trigger=${reason}`);
        return;
      }
      if (inFlightRef.current) {
        console.log(`[picker] commit skipped (in flight) trigger=${reason}`);
        return;
      }
      inFlightRef.current = true;
      console.log(
        `[picker] commit trigger=${reason} add=[${toAddIds.join(',')}] ` +
          `del=[${toDeleteIds.join(',')}] custom=[${toAddCustoms.join(',')}]`,
      );

      try {
        await Promise.all([
          ...toAddIds.map((exerciseId) =>
            postApiTrainingPlansDaysDayIdExercises(dayId, withDefaults(exerciseId, null)).then(
              (res) => {
                if (res?.id) newRowIdsRef.current.set(exerciseId, res.id);
              },
            ),
          ),
          ...toAddCustoms.map((name) =>
            postApiTrainingPlansDaysDayIdExercises(dayId, withDefaults(null, name)),
          ),
          ...toDeleteIds.map((id) => {
            const rowId = existingByExerciseId.get(id)?.id ?? newRowIdsRef.current.get(id);
            return rowId
              ? deleteApiTrainingPlansExercisesPlanDayExerciseId(rowId)
              : Promise.resolve();
          }),
        ]);

        // Advance the baseline so a later flush only sends the new delta.
        persistedIdsRef.current = new Set(selectedIds);
        toAddCustoms.forEach((name) => sentCustomsRef.current.add(name));

        queryClient.invalidateQueries({
          queryKey: getGetApiTrainingPlansDaysDayIdQueryKey(dayId),
        });
        queryClient.invalidateQueries({ queryKey: getGetApiTrainingPlansPlanIdQueryKey(planId) });
      } finally {
        inFlightRef.current = false;
      }
    },
    [dayId, planId, queryClient],
  );

  // Safety net for the app being backgrounded or killed mid-picker.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') commit(`appstate-${next}`);
    });
    return () => sub.remove();
  }, [commit]);

  return commit;
};
