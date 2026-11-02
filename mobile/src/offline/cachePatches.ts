import type { QueryClient } from '@tanstack/react-query';
import { getGetApiWorkoutsWorkoutIdQueryKey } from '../api/generated/workouts/workouts';
import type {
  LastPerformanceResponse,
  PlanDayResponse,
  SetResponse,
  WorkoutByDateResponse,
  WorkoutExerciseResponse,
  WorkoutResponse,
} from '../api/generated/schemas';
import { BY_DATE_MARKER, KEY_PREFIX, keyHead, keyStartsWith } from './queryKeys';

/// Reads and patches of the query cache that the optimistic writes in mutationDefaults.ts
/// share. Most writes name only the row they touch, not the query that holds it, so the
/// helpers here find the holder by looking through the cache rather than by its key.

/// Every cached plan day, whatever key it sits under.
const cachedPlanDays = (queryClient: QueryClient) =>
  queryClient.getQueriesData<PlanDayResponse>({
    predicate: (query) => keyStartsWith(query.queryKey, KEY_PREFIX.planDay),
  });

/// Some writes name only the row, not the day it sits on, so the day has to be found by
/// looking for whichever cached one is holding it.
export const patchPlanDayHolding = (
  queryClient: QueryClient,
  planDayExerciseId: string,
  patch: (day: PlanDayResponse) => PlanDayResponse,
) => {
  for (const [queryKey, day] of cachedPlanDays(queryClient)) {
    if (day?.exercises.some((exercise) => exercise.id === planDayExerciseId)) {
      queryClient.setQueryData<PlanDayResponse>(queryKey, patch(day));
    }
  }
};

/// The "today" screen reads a workout by user and date, but the user id is not in the
/// mutation variables because the server takes it from the token. So the entry is found
/// by what it is rather than by its key.
const patchWorkoutForDate = (
  queryClient: QueryClient,
  performedAt: string,
  entry: WorkoutByDateResponse,
) => {
  const cached = queryClient.getQueriesData<WorkoutByDateResponse>({
    predicate: (query) => {
      const [first, params] = query.queryKey;
      if (typeof first !== 'string' || !first.includes(BY_DATE_MARKER)) return false;
      return (params as { date?: string } | undefined)?.date === performedAt;
    },
  });

  for (const [queryKey] of cached) {
    queryClient.setQueryData<WorkoutByDateResponse>(queryKey, entry);
  }
};

/// Every cached session, whatever key it sits under. The shape of the data is what tells a
/// workout apart from the by-date and history entries that share its key prefix.
const cachedWorkouts = (queryClient: QueryClient) =>
  queryClient.getQueriesData<WorkoutResponse>({
    predicate: (query) => {
      if (!keyStartsWith(query.queryKey, KEY_PREFIX.workoutEntry)) return false;
      return Array.isArray((query.state.data as WorkoutResponse | undefined)?.exercises);
    },
  });

/// A logged set names only the exercise it belongs to, not the session - so the session is
/// found by looking for whichever cached one is holding that exercise. `patch` returning
/// null takes the exercise out.
export const patchWorkoutHolding = (
  queryClient: QueryClient,
  workoutExerciseId: string,
  patch: (exercise: WorkoutExerciseResponse) => WorkoutExerciseResponse | null,
) => {
  for (const [queryKey, workout] of cachedWorkouts(queryClient)) {
    if (!workout?.exercises.some((exercise) => exercise.id === workoutExerciseId)) continue;

    queryClient.setQueryData<WorkoutResponse>(queryKey, {
      ...workout,
      exercises: workout.exercises.flatMap((exercise) => {
        if (exercise.id !== workoutExerciseId) return [exercise];
        const patched = patch(exercise);
        return patched ? [patched] : [];
      }),
    });
  }
};

/// A set is named only by its own id, so the session holding it is found by looking.
/// `patch` returning null takes the set out.
export const patchSetHolding = (
  queryClient: QueryClient,
  setId: string,
  patch: (set: SetResponse) => SetResponse | null,
) => {
  const holds = (exercise: WorkoutExerciseResponse) => exercise.sets.some((set) => set.id === setId);

  for (const [queryKey, workout] of cachedWorkouts(queryClient)) {
    if (!workout?.exercises.some(holds)) continue;

    queryClient.setQueryData<WorkoutResponse>(queryKey, {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        holds(exercise)
          ? {
              ...exercise,
              sets: exercise.sets.flatMap((set) => {
                if (set.id !== setId) return [set];
                const patched = patch(set);
                return patched ? [patched] : [];
              }),
            }
          : exercise,
      ),
    });
  }
};

/// The "last time" for an exercise, from what the phone knows right now.
///
/// The server's answer rides on the plan day, but it is only as fresh as the last time the
/// day was fetched - and sessions logged offline since are not in it at all. Those sit in
/// the cache as workouts of their own, so the latest of the two wins - and on the same date
/// the cached session, which carries any correction made since. Sessions dated after the
/// one being filled in do not count, as on the server.
export const latestKnownPerformance = (
  queryClient: QueryClient,
  exerciseId: string | null,
  fromServer: LastPerformanceResponse | null,
  session: { id: string; performedAt: string },
): LastPerformanceResponse | null => {
  if (!exerciseId) return fromServer;

  let best = fromServer;
  for (const [, workout] of cachedWorkouts(queryClient)) {
    if (!workout || workout.id === session.id) continue;
    if (workout.performedAt > session.performedAt) continue;
    if (best && workout.performedAt < best.performedAt) continue;

    const lifted = workout.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId && exercise.sets.length > 0,
    );
    if (!lifted) continue;

    best = {
      performedAt: workout.performedAt,
      sets: lifted.sets.map((set) => ({ weightKg: set.weightKg, reps: set.reps })),
    };
  }

  return best;
};

/// Seeds a session so the screen can be opened on our own id right away. Without this a
/// tap made offline leaves the mutation paused forever, which reads on screen as a button
/// stuck on "Zaczynam..." and an app that has hung.
export const seedWorkout = (queryClient: QueryClient, workout: WorkoutResponse) => {
  queryClient.setQueryData<WorkoutResponse>(
    getGetApiWorkoutsWorkoutIdQueryKey(workout.id),
    workout,
  );

  patchWorkoutForDate(queryClient, workout.performedAt, {
    id: workout.id,
    name: workout.name,
    performedAt: workout.performedAt,
    exerciseCount: workout.exercises.length,
    planDayId: workout.planDayId,
    planDayName: workout.planDayName,
  });
};

/// Drops a deleted session's own entry and returns what it held, if anything.
///
/// Left behind, the entry would keep feeding "last time" from a session that no longer
/// exists - and it is persisted, so for good. The screen showing it is being closed, and
/// an observer keeps what it last rendered.
export const forgetWorkout = (
  queryClient: QueryClient,
  workoutId: string,
): WorkoutResponse | undefined => {
  const queryKey = getGetApiWorkoutsWorkoutIdQueryKey(workoutId);
  const deleted = queryClient.getQueryData<WorkoutResponse>(queryKey);
  queryClient.removeQueries({ queryKey, exact: true });
  return deleted;
};

/// A plan day may hold a deleted session as the server's "last time". What came before it
/// is not known here, so the hint is cleared rather than left wrong; the refetch owed to
/// the plans family brings the right one back.
export const clearLastPerformanceFrom = (queryClient: QueryClient, deleted: WorkoutResponse) => {
  const lifted = new Set(deleted.exercises.map((exercise) => exercise.exerciseId));

  for (const [queryKey, day] of cachedPlanDays(queryClient)) {
    if (!day?.exercises) continue;
    queryClient.setQueryData<PlanDayResponse>(queryKey, {
      ...day,
      exercises: day.exercises.map((exercise) =>
        lifted.has(exercise.exerciseId) &&
        exercise.lastPerformance?.performedAt === deleted.performedAt
          ? { ...exercise, lastPerformance: null }
          : exercise,
      ),
    });
  }
};

/// Takes a deleted session off every list it appears on: today's entry, the calendar month
/// and the history page.
export const removeWorkoutFromLists = (queryClient: QueryClient, workoutId: string) => {
  const lists = queryClient.getQueriesData<unknown>({
    predicate: (query) => keyStartsWith(query.queryKey, KEY_PREFIX.workoutEntry),
  });

  for (const [queryKey, data] of lists) {
    if (keyHead(queryKey)?.includes(BY_DATE_MARKER)) {
      if ((data as WorkoutByDateResponse | undefined)?.id === workoutId) {
        // The server answers 404 for a day with no session, which leaves the query
        // without data; null is the closest a cache entry gets to that.
        queryClient.setQueryData(queryKey, null);
      }
      continue;
    }

    if (Array.isArray(data)) {
      queryClient.setQueryData(
        queryKey,
        data.filter((entry: { id?: string }) => entry.id !== workoutId),
      );
      continue;
    }

    const page = data as { items?: { id: string }[] } | undefined;
    if (Array.isArray(page?.items)) {
      queryClient.setQueryData(queryKey, {
        ...page,
        items: page.items.filter((entry) => entry.id !== workoutId),
      });
    }
  }
};
