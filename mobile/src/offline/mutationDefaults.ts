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
  PlanDayResponse,
  WorkoutExerciseResponse,
  WorkoutResponse,
  TrainingPlanResponse,
  TrainingPlanSummaryResponse,
} from '../api/generated/schemas';
import {
  clearLastPerformanceFrom,
  forgetWorkout,
  latestKnownPerformance,
  patchPlanDayHolding,
  patchSetHolding,
  patchWorkoutHolding,
  removeWorkoutFromLists,
  seedWorkout,
} from './cachePatches';
import { newId } from './ids';
import { RetiredClientError } from './retiredClient';
import { type QueryFamily, optimistic } from './optimistic';

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

  registerDesiredState(getPutApiTrainingPlansPlanIdDaysOrderMutationOptions(), ['plans']);

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
  // No apply: the picker patches the day itself; see PlanDayExercisePickerScreen.
  registerDesiredState(getPutApiTrainingPlansDaysDayIdExercisesMutationOptions(), ['plans']);

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
      patchWorkoutHolding(client, workoutExerciseId, () => null);
    },
  );

  // Removing a session can move the next suggested plan day back, so the plan queries are
  // disturbed too.
  register(
    getDeleteApiWorkoutsWorkoutIdMutationOptions(),
    ['workouts', 'plans'],
    ({ workoutId }, client) => {
      const deleted = forgetWorkout(client, workoutId);
      if (deleted) clearLastPerformanceFrom(client, deleted);
      removeWorkoutFromLists(client, workoutId);
    },
  );
};
