import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  putApiTrainingPlansDaysDayIdExercises,
  getGetApiTrainingPlansDaysDayIdQueryKey,
  getGetApiTrainingPlansPlanIdQueryKey,
} from '../../../api/generated/training-plans/training-plans';
import { PlanDayExerciseSelection } from '../../../api/generated/schemas';

type Args = {
  dayId: string;
  planId: string;
  /// The exercises the day should hold, in order. Null until the day has loaded -
  /// the first non-null value becomes the baseline we diff against.
  items: PlanDayExerciseSelection[] | null;
  onError: () => void;
};

const DEBOUNCE_MS = 1000;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

const signatureOf = (items: PlanDayExerciseSelection[]) =>
  JSON.stringify(
    items.map((i) => i.planDayExerciseId ?? i.exerciseId ?? `custom:${i.customExerciseName}`),
  );

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/// Keeps the server's copy of a day's exercise list in step with the local one.
///
/// The request carries the desired state rather than a list of add/remove operations,
/// so sending it twice is harmless - that is what lets us retry after a dropped
/// connection without risking duplicates. Writes are debounced and de-duplicated by
/// signature, so toggling the same exercise back and forth costs no requests at all.
export const usePlanDayExercisesSync = ({ dayId, planId, items, onError }: Args) => {
  const queryClient = useQueryClient();

  const itemsRef = useRef<PlanDayExerciseSelection[] | null>(items);
  itemsRef.current = items;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const committedSignatureRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const rerunRef = useRef(false);

  const flush = useCallback(
    async (reason: string): Promise<void> => {
      const current = itemsRef.current;
      if (!current || committedSignatureRef.current === null) return;

      const signature = signatureOf(current);
      if (signature === committedSignatureRef.current) {
        console.log(`[picker] sync skipped (no change) trigger=${reason}`);
        return;
      }
      if (inFlightRef.current) {
        // Never drop the change - replay it once the in-flight write lands.
        rerunRef.current = true;
        console.log(`[picker] sync queued behind in-flight write trigger=${reason}`);
        return;
      }

      inFlightRef.current = true;
      console.log(`[picker] sync trigger=${reason} items=${current.length}`);

      try {
        for (let attempt = 0; ; attempt++) {
          try {
            await putApiTrainingPlansDaysDayIdExercises(dayId, { exercises: current });
            committedSignatureRef.current = signature;
            console.log(`[picker] sync ok (attempt ${attempt + 1})`);
            queryClient.invalidateQueries({
              queryKey: getGetApiTrainingPlansDaysDayIdQueryKey(dayId),
            });
            queryClient.invalidateQueries({
              queryKey: getGetApiTrainingPlansPlanIdQueryKey(planId),
            });
            return;
          } catch (error) {
            if (attempt >= RETRY_DELAYS_MS.length) {
              console.log('[picker] sync FAILED permanently', error);
              // Drop the optimistic list and show whatever the server really holds.
              queryClient.invalidateQueries({
                queryKey: getGetApiTrainingPlansDaysDayIdQueryKey(dayId),
              });
              onErrorRef.current();
              return;
            }
            console.log(`[picker] sync retry in ${RETRY_DELAYS_MS[attempt]}ms`, error);
            await delay(RETRY_DELAYS_MS[attempt]);
          }
        }
      } finally {
        inFlightRef.current = false;
        if (rerunRef.current) {
          rerunRef.current = false;
          void flush('rerun-after-inflight');
        }
      }
    },
    [dayId, planId, queryClient],
  );

  // Seed the baseline from the first list we see, then debounce every later change.
  useEffect(() => {
    if (!items) return;

    if (committedSignatureRef.current === null) {
      committedSignatureRef.current = signatureOf(items);
      return;
    }
    if (signatureOf(items) === committedSignatureRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush('debounce'), DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items, flush]);

  // Backgrounding is the last moment we are sure to get before the app can be killed.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        if (timerRef.current) clearTimeout(timerRef.current);
        void flush(`appstate-${next}`);
      }
    });
    return () => sub.remove();
  }, [flush]);

  return flush;
};
