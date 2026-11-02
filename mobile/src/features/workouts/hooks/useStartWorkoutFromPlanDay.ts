import { useQueryClient } from '@tanstack/react-query';
import { usePostApiWorkoutsFromPlanDay } from '../../../api/generated/workouts/workouts';
import { getToday } from '../../../lib/date';
import { newId } from '../../../offline/ids';
import { isInFlight } from '../../../offline/isInFlight';
import { planDaySessionCopy } from '../planDaySessionCopy';

/// Starts today's session from a plan day - the one way every screen opens a session from
/// the plan.
///
/// `start` returns the new workout's id, so the caller can navigate into the session at
/// once. `isStartingNow` is true only while the write is actually in flight.
export const useStartWorkoutFromPlanDay = () => {
  const queryClient = useQueryClient();
  const today = getToday();
  const mutation = usePostApiWorkoutsFromPlanDay();
  const { mutate } = mutation;

  const start = (planDayId: string): string => {
    // Our own id, so the session opens straight away - the registry has already seeded
    // it into the cache by the time the caller navigates.
    const id = newId();
    mutate({
      data: {
        id,
        planDayId,
        performedAt: today,
        ...planDaySessionCopy(queryClient, planDayId),
      },
    });
    return id;
  };

  return { start, isStartingNow: isInFlight(mutation) };
};
