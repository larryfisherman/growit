import { QueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  getDeleteApiExercisesSetsSetIdMutationOptions,
  getGetApiExercisesQueryKey,
  getPostApiExercisesWorkoutExerciseIdSetsMutationOptions,
  getPutApiExercisesSetsSetIdMutationOptions,
} from '../api/generated/exercises/exercises';
import {
  getDeleteApiTrainingPlansDaysDayIdMutationOptions,
  getDeleteApiTrainingPlansExercisesPlanDayExerciseIdMutationOptions,
  getDeleteApiTrainingPlansPlanIdMutationOptions,
  getGetApiTrainingPlansPlanIdQueryKey,
  getGetApiTrainingPlansQueryKey,
  getGetApiTrainingPlansDaysDayIdQueryKey,
  getPostApiTrainingPlansDaysDayIdExercisesMutationOptions,
  getPostApiTrainingPlansMutationOptions,
  getPostApiTrainingPlansPlanIdDaysMutationOptions,
  getPutApiTrainingPlansDaysDayIdExercisesMutationOptions,
  getPutApiTrainingPlansDaysDayIdMutationOptions,
  getPutApiTrainingPlansExercisesPlanDayExerciseIdMutationOptions,
  getPutApiTrainingPlansPlanIdActiveMutationOptions,
  getPutApiTrainingPlansPlanIdDaysOrderMutationOptions,
  getPutApiTrainingPlansPlanIdMutationOptions,
} from '../api/generated/training-plans/training-plans';
import {
  getDeleteApiWorkoutsExercisesWorkoutExerciseIdMutationOptions,
  getDeleteApiWorkoutsWorkoutIdMutationOptions,
  getGetApiWorkoutsWorkoutIdQueryKey,
  getPostApiWorkoutsFromPlanDayMutationOptions,
  getPostApiWorkoutsMutationOptions,
  getPostApiWorkoutsWorkoutIdExercisesMutationOptions,
} from '../api/generated/workouts/workouts';
import type {
  ExerciseResponse,
  LastPerformanceResponse,
  PlanDayResponse,
  SetResponse,
  WorkoutByDateResponse,
  WorkoutExerciseResponse,
  WorkoutResponse,
  TrainingPlanResponse,
  TrainingPlanSummaryResponse,
} from '../api/generated/schemas';
import { newId } from './ids';
import { RetiredClientError } from './retiredClient';
import { type QueryFamily, optimistic } from './optimistic';

const PLAN_DAY_KEY_PREFIX = '/api/training-plans/days/';

/// Some writes name only the row, not the day it sits on, so the day has to be found by
/// looking for whichever cached one is holding it.
const patchPlanDayHolding = (
  queryClient: QueryClient,
  planDayExerciseId: string,
  patch: (day: PlanDayResponse) => PlanDayResponse,
) => {
  const cached = queryClient.getQueriesData<PlanDayResponse>({
    predicate: (query) => {
      const [first] = query.queryKey;
      return typeof first === 'string' && first.startsWith(PLAN_DAY_KEY_PREFIX);
    },
  });

  for (const [queryKey, day] of cached) {
    if (day?.exercises.some((exercise) => exercise.id === planDayExerciseId)) {
      queryClient.setQueryData<PlanDayResponse>(queryKey, patch(day));
    }
  }
};

const WORKOUT_BY_DATE_KEY_MARKER = '/by-date';
const WORKOUT_KEY_PREFIX = '/api/Workouts/';

/// The "today" screen reads a workout by user and date, and the user id is not in the
/// mutation variables - it was dropped from the contract once the server started taking
/// it from the token. So the entry is found by what it is rather than by its key.
const patchWorkoutForDate = (
  queryClient: QueryClient,
  performedAt: string,
  entry: WorkoutByDateResponse,
) => {
  const cached = queryClient.getQueriesData<WorkoutByDateResponse>({
    predicate: (query) => {
      const [first, params] = query.queryKey;
      if (typeof first !== 'string' || !first.includes(WORKOUT_BY_DATE_KEY_MARKER)) return false;
      return (params as { date?: string } | undefined)?.date === performedAt;
    },
  });

  for (const [queryKey] of cached) {
    queryClient.setQueryData<WorkoutByDateResponse>(queryKey, entry);
  }
};

/// A logged set names only the exercise it belongs to, not the session - so the session is
/// found by looking for whichever cached one is holding that exercise. The shape of the
/// data is what tells a workout apart from the by-date and history entries that share its
/// key prefix.
const patchWorkoutHolding = (
  queryClient: QueryClient,
  workoutExerciseId: string,
  patch: (exercise: WorkoutExerciseResponse) => WorkoutExerciseResponse,
) => {
  const cached = queryClient.getQueriesData<WorkoutResponse>({
    predicate: (query) => {
      const [first] = query.queryKey;
      if (typeof first !== 'string' || !first.startsWith(WORKOUT_KEY_PREFIX)) return false;

      const workout = query.state.data as WorkoutResponse | undefined;
      return workout?.exercises?.some((exercise) => exercise.id === workoutExerciseId) === true;
    },
  });

  for (const [queryKey, workout] of cached) {
    if (!workout) continue;

    queryClient.setQueryData<WorkoutResponse>(queryKey, {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.id === workoutExerciseId ? patch(exercise) : exercise,
      ),
    });
  }
};

/// Every cached session, whatever key it sits under. The shape of the data is what tells a
/// workout apart from the by-date and history entries that share its key prefix.
const cachedWorkouts = (queryClient: QueryClient) =>
  queryClient.getQueriesData<WorkoutResponse>({
    predicate: (query) => {
      const [first] = query.queryKey;
      if (typeof first !== 'string' || !first.startsWith(WORKOUT_KEY_PREFIX)) return false;
      return Array.isArray((query.state.data as WorkoutResponse | undefined)?.exercises);
    },
  });

/// A set is named only by its own id, so the session holding it is found by looking.
/// `patch` returning null takes the set out.
const patchSetHolding = (
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
const seedWorkout = (queryClient: QueryClient, workout: WorkoutResponse) => {
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

/// Everything a write does - the optimistic patch, the invalidation - lives here rather
/// than at the call site, for two reasons.
///
/// The first is that a mutation restored from storage after the app was killed has no
/// component behind it. Its mutationFn has to come from somewhere, and setMutationDefaults
/// is that somewhere; without it a resumed write fails with "No mutationFn found".
///
/// The second is that options passed at a hook override these defaults outright
/// ({...defaultOptions, ...mutationDefaults, ...options}). An onSuccess left in a screen
/// does not merge with what is registered here - it replaces it, silently, and the write
/// stops invalidating anything. So callbacks belong here and nowhere else; screens hand
/// their UI effects to mutate(variables, { onSuccess }) instead, which runs through the
/// observer on its own.
///
/// Registrations are built from orval's own factories, so regenerating the client after a
/// contract change breaks the build rather than quietly detaching a key from its defaults.
export const registerMutationDefaults = (
  queryClient: QueryClient,
  /// Filled in as we go: the keys whose queued writes may be thrown away when a newer
  /// one for the same target arrives. See coalesce.ts.
  supersedable: Set<string>,
  /// True once the client has been torn down. Checked on every attempt, retries
  /// included, because a write already moving through the queue does not stop on its
  /// own. See queryClient.ts.
  isRetired: () => boolean = () => false,
) => {
  // Taking orval's own options object means TVariables is inferred from the generated
  // client, so a contract change lands as a type error in the patch below rather than as
  // a silently mismatched field at runtime.
  const register = <TData, TVariables>(
    base: UseMutationOptions<TData, unknown, TVariables, unknown>,
    families: readonly QueryFamily[],
    apply?: (variables: TVariables, queryClient: QueryClient) => void,
  ) => {
    if (!base.mutationKey) {
      throw new Error('Orval stopped emitting a mutationKey; the offline registry needs one.');
    }

    const send = base.mutationFn;
    if (!send) throw new Error('Orval stopped emitting a mutationFn; the offline registry needs one.');

    queryClient.setMutationDefaults(base.mutationKey, {
      mutationFn: (...args: Parameters<typeof send>) =>
        isRetired() ? Promise.reject(new RetiredClientError()) : send(...args),
      ...optimistic(queryClient, families, apply),
    });

    return base.mutationKey;
  };

  /// For writes that carry the whole desired state of their target rather than a delta,
  /// so an older queued copy of the same write is pure waste once a newer one exists.
  const registerDesiredState: typeof register = (base, families, apply) => {
    const mutationKey = register(base, families, apply);
    supersedable.add(JSON.stringify(mutationKey));
    return mutationKey;
  };

  // ---------------------------------------------------------------- training plans

  register(
    getPostApiTrainingPlansMutationOptions(),
    ['plans'],
    ({ data }, client) => {
      const listKey = getGetApiTrainingPlansQueryKey();
      const plans = client.getQueryData<TrainingPlanSummaryResponse[]>(listKey);

      // The server makes a user's first plan the active one, so guessing false here would
      // have the today screen offer "Ułóż plan treningowy" next to a plan that was just
      // created - for as long as the user stays offline.
      const isActive = (plans?.length ?? 0) === 0;

      // Seeded so the screen can switch from "new" to "editing" on our own id, with no
      // round trip to wait for.
      client.setQueryData<TrainingPlanResponse>(getGetApiTrainingPlansPlanIdQueryKey(data.id), {
        id: data.id,
        name: data.name,
        notes: data.notes ?? null,
        isActive,
        days: [],
      });

      // Falling back to [entry] rather than leaving the list alone: a plan created before
      // the list was ever loaded would otherwise not appear on it at all.
      client.setQueryData<TrainingPlanSummaryResponse[]>(listKey, (old) => [
        ...(old ?? []),
        { id: data.id, name: data.name, isActive, dayCount: 0 },
      ]);
    },
  );

  registerDesiredState(
getPutApiTrainingPlansPlanIdMutationOptions(),
    ['plans'],
    ({ planId, data }, client) => {
      client.setQueryData<TrainingPlanResponse>(
        getGetApiTrainingPlansPlanIdQueryKey(planId),
        (old) => (old ? { ...old, name: data.name, notes: data.notes ?? null } : old),
      );
      client.setQueryData<TrainingPlanSummaryResponse[]>(getGetApiTrainingPlansQueryKey(), (old) =>
        old?.map((plan) => (plan.id === planId ? { ...plan, name: data.name } : plan)),
      );
    },
  );

  register(
    getDeleteApiTrainingPlansPlanIdMutationOptions(),
    ['plans'],
    ({ planId }, client) => {
      client.setQueryData<TrainingPlanSummaryResponse[]>(getGetApiTrainingPlansQueryKey(), (old) =>
        old?.filter((plan) => plan.id !== planId),
      );
    },
  );

  registerDesiredState(
getPutApiTrainingPlansPlanIdActiveMutationOptions(),
    ['plans'],
    ({ planId }, client) => {
      // Exactly one plan is active, so the others have to give it up in the same breath.
      client.setQueryData<TrainingPlanSummaryResponse[]>(getGetApiTrainingPlansQueryKey(), (old) =>
        old?.map((plan) => ({ ...plan, isActive: plan.id === planId })),
      );
    },
  );

  register(
    getPostApiTrainingPlansPlanIdDaysMutationOptions(),
    ['plans'],
    ({ planId, data }, client) => {
      const planKey = getGetApiTrainingPlansPlanIdQueryKey(planId);
      const plan = client.getQueryData<TrainingPlanResponse>(planKey);
      const orderIndex = plan?.days.length ?? 0;

      // Seeded so the day screen can be opened on our own id straight away, instead of
      // arriving before the write and reading a 404.
      client.setQueryData<PlanDayResponse>(getGetApiTrainingPlansDaysDayIdQueryKey(data.id), {
        id: data.id,
        planId,
        name: data.name,
        notes: data.notes ?? null,
        orderIndex,
        hasBeenPerformed: false,
        exercises: [],
      });

      client.setQueryData<TrainingPlanResponse>(planKey, (old) =>
        old
          ? {
              ...old,
              days: [...old.days, { id: data.id, name: data.name, orderIndex, exerciseCount: 0 }],
            }
          : old,
      );

      // The plans list shows a day count per plan, and offline nothing else will correct
      // it until the write lands.
      client.setQueryData<TrainingPlanSummaryResponse[]>(getGetApiTrainingPlansQueryKey(), (old) =>
        old?.map((plan) =>
          plan.id === planId ? { ...plan, dayCount: plan.dayCount + 1 } : plan,
        ),
      );
    },
  );

  registerDesiredState(
getPutApiTrainingPlansPlanIdDaysOrderMutationOptions(), ['plans']);

  registerDesiredState(
getPutApiTrainingPlansDaysDayIdMutationOptions(),
    ['plans'],
    ({ dayId, data }, client) => {
      client.setQueryData<PlanDayResponse>(getGetApiTrainingPlansDaysDayIdQueryKey(dayId), (old) =>
        old ? { ...old, name: data.name, notes: data.notes ?? null } : old,
      );
    },
  );

  register(getDeleteApiTrainingPlansDaysDayIdMutationOptions(), ['plans']);
  register(getPostApiTrainingPlansDaysDayIdExercisesMutationOptions(), ['plans']);
  registerDesiredState(
getPutApiTrainingPlansDaysDayIdExercisesMutationOptions(), ['plans']);

  registerDesiredState(
getPutApiTrainingPlansExercisesPlanDayExerciseIdMutationOptions(),
    ['plans'],
    ({ planDayExerciseId, data }, client) => {
      patchPlanDayHolding(client, planDayExerciseId, (day) => ({
        ...day,
        exercises: day.exercises.map((exercise) =>
          exercise.id === planDayExerciseId
            ? {
                ...exercise,
                targetSets: data.targetSets,
                targetReps: data.targetReps,
                restSeconds: data.restSeconds,
                orderIndex: data.orderIndex,
              }
            : exercise,
        ),
      }));
    },
  );

  register(
    getDeleteApiTrainingPlansExercisesPlanDayExerciseIdMutationOptions(),
    ['plans'],
    ({ planDayExerciseId }, client) => {
      patchPlanDayHolding(client, planDayExerciseId, (day) => ({
        ...day,
        exercises: day.exercises.filter((exercise) => exercise.id !== planDayExerciseId),
      }));
    },
  );

  // --------------------------------------------------------------------- workouts

  // Starting or creating a session changes which day the today screen suggests next, so
  // these disturb the plan queries as well as the workout ones.
  register(getPostApiWorkoutsMutationOptions(), ['workouts', 'plans'], ({ data }, client) => {
    seedWorkout(client, {
      id: data.id,
      name: data.name,
      performedAt: data.performedAt,
      notes: data.notes ?? null,
      planDayId: null,
      planDayName: null,
      exercises: [],
    });
  });

  register(
    getPostApiWorkoutsFromPlanDayMutationOptions(),
    ['workouts', 'plans'],
    ({ data }, client) => {
      // The session is a copy of the plan day, so the day in cache is what it should
      // look like. If the day was never opened there is nothing to copy from and the
      // exercises arrive with the refetch.
      const day = client.getQueryData<PlanDayResponse>(
        getGetApiTrainingPlansDaysDayIdQueryKey(data.planDayId),
      );

      // Ids the caller already promised the server, so the copy carries the same ones
      // here as it will there.
      const promised = new Map(
        (data.exerciseIds ?? []).map((a) => [a.planDayExerciseId, a.workoutExerciseId]),
      );

      const exercises: WorkoutExerciseResponse[] = (day?.exercises ?? []).map((exercise) => ({
        id: promised.get(exercise.id) ?? newId(),
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        category: exercise.category,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
        orderIndex: exercise.orderIndex,
        sets: [],
        lastPerformance: latestKnownPerformance(
          client,
          exercise.exerciseId,
          exercise.lastPerformance,
          data,
        ),
      }));

      seedWorkout(client, {
        id: data.id,
        name: day?.name ?? 'Trening',
        performedAt: data.performedAt,
        notes: null,
        planDayId: data.planDayId,
        planDayName: day?.name ?? null,
        exercises,
      });
    },
  );

  register(
    getPostApiWorkoutsWorkoutIdExercisesMutationOptions(),
    ['workouts'],
    ({ workoutId, data }, client) => {
      const fromLibrary = client
        .getQueryData<ExerciseResponse[]>(getGetApiExercisesQueryKey())
        ?.find((exercise) => exercise.id === data.exerciseId);

      client.setQueryData<WorkoutResponse>(
        getGetApiWorkoutsWorkoutIdQueryKey(workoutId),
        (old) =>
          old
            ? {
                ...old,
                exercises: [
                  ...old.exercises,
                  {
                    id: data.id,
                    exerciseId: data.exerciseId,
                    // The payload carries only the id, so the name comes from the
                    // library - which every screen that can reach this point has already
                    // loaded and holds indefinitely.
                    exerciseName: fromLibrary?.name ?? '',
                    category: fromLibrary?.category ?? null,
                    targetSets: data.targetSets,
                    targetReps: data.targetReps,
                    restSeconds: data.restSeconds,
                    orderIndex: data.orderIndex,
                    sets: [],
                    lastPerformance: latestKnownPerformance(client, data.exerciseId, null, old),
                  },
                ],
              }
            : old,
      );
    },
  );
  register(
    getPostApiExercisesWorkoutExerciseIdSetsMutationOptions(),
    ['workouts'],
    ({ workoutExerciseId, data }, client) => {
      patchWorkoutHolding(client, workoutExerciseId, (exercise) => ({
        ...exercise,
        sets: [
          ...exercise.sets,
          { id: data.id, weightKg: data.weightKg, reps: data.reps, orderIndex: data.orderIndex },
        ],
      }));
    },
  );

  // Corrections. A fix carries the whole set, so typing over a wrong weight three times
  // with no signal leaves one request in the queue, not three.
  registerDesiredState(
    getPutApiExercisesSetsSetIdMutationOptions(),
    ['workouts'],
    ({ setId, data }, client) => {
      patchSetHolding(client, setId, (set) => ({ ...set, weightKg: data.weightKg, reps: data.reps }));
    },
  );

  register(getDeleteApiExercisesSetsSetIdMutationOptions(), ['workouts'], ({ setId }, client) => {
    patchSetHolding(client, setId, () => null);
  });

  register(
    getDeleteApiWorkoutsExercisesWorkoutExerciseIdMutationOptions(),
    ['workouts'],
    ({ workoutExerciseId }, client) => {
      for (const [queryKey, workout] of cachedWorkouts(client)) {
        if (!workout?.exercises.some((exercise) => exercise.id === workoutExerciseId)) continue;

        client.setQueryData<WorkoutResponse>(queryKey, {
          ...workout,
          exercises: workout.exercises.filter((exercise) => exercise.id !== workoutExerciseId),
        });
      }
    },
  );

  // Removing a session can move the next suggested plan day back, so the plan queries are
  // disturbed too.
  register(
    getDeleteApiWorkoutsWorkoutIdMutationOptions(),
    ['workouts', 'plans'],
    ({ workoutId }, client) => {
      // The session's own entry goes too. Left behind it would keep feeding "last time"
      // from a session that no longer exists - and it is persisted, so for good. The
      // screen showing it is being closed, and an observer keeps what it last rendered.
      const deleted = client.getQueryData<WorkoutResponse>(getGetApiWorkoutsWorkoutIdQueryKey(workoutId));
      client.removeQueries({ queryKey: getGetApiWorkoutsWorkoutIdQueryKey(workoutId), exact: true });

      // A plan day may hold the same session as the server's "last time". What came
      // before it is not known here, so the hint is cleared rather than left wrong; the
      // refetch owed to the plans family brings the right one back.
      if (deleted) {
        const lifted = new Set(deleted.exercises.map((exercise) => exercise.exerciseId));
        const days = client.getQueriesData<PlanDayResponse>({
          predicate: (query) => {
            const [first] = query.queryKey;
            return typeof first === 'string' && first.startsWith(PLAN_DAY_KEY_PREFIX);
          },
        });

        for (const [queryKey, day] of days) {
          if (!day?.exercises) continue;
          client.setQueryData<PlanDayResponse>(queryKey, {
            ...day,
            exercises: day.exercises.map((exercise) =>
              lifted.has(exercise.exerciseId) &&
              exercise.lastPerformance?.performedAt === deleted.performedAt
                ? { ...exercise, lastPerformance: null }
                : exercise,
            ),
          });
        }
      }

      // Every list the session appears on: today's entry, the calendar month and the
      // history page.
      const lists = client.getQueriesData<unknown>({
        predicate: (query) => {
          const [first] = query.queryKey;
          return typeof first === 'string' && first.startsWith(WORKOUT_KEY_PREFIX);
        },
      });

      for (const [queryKey, data] of lists) {
        const [first] = queryKey;

        if (typeof first === 'string' && first.includes(WORKOUT_BY_DATE_KEY_MARKER)) {
          if ((data as WorkoutByDateResponse | undefined)?.id === workoutId) {
            // The server answers 404 for a day with no session, which leaves the query
            // without data; null is the closest a cache entry gets to that.
            client.setQueryData(queryKey, null);
          }
          continue;
        }

        if (Array.isArray(data)) {
          client.setQueryData(
            queryKey,
            data.filter((entry: { id?: string }) => entry.id !== workoutId),
          );
          continue;
        }

        const page = data as { items?: { id: string }[] } | undefined;
        if (Array.isArray(page?.items)) {
          client.setQueryData(queryKey, {
            ...page,
            items: page.items.filter((entry) => entry.id !== workoutId),
          });
        }
      }
    },
  );
};
