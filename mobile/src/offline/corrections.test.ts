/// <reference types="node" />
import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import {
  getDeleteApiExercisesSetsSetIdMutationOptions,
  getPostApiExercisesWorkoutExerciseIdSetsMutationOptions,
  getPutApiExercisesSetsSetIdMutationOptions,
} from '../api/generated/exercises/exercises.ts';
import { getGetApiTrainingPlansDaysDayIdQueryKey } from '../api/generated/training-plans/training-plans.ts';
import {
  getDeleteApiWorkoutsExercisesWorkoutExerciseIdMutationOptions,
  getDeleteApiWorkoutsWorkoutIdMutationOptions,
  getGetApiWorkoutsUserIdByDateQueryKey,
  getGetApiWorkoutsUserIdByMonthQueryKey,
  getGetApiWorkoutsWorkoutIdQueryKey,
  getPostApiWorkoutsFromPlanDayMutationOptions,
} from '../api/generated/workouts/workouts.ts';
import type {
  PlanDayResponse,
  WorkoutByDateResponse,
  WorkoutResponse,
  WorkoutSummaryResponse,
} from '../api/generated/schemas/index.ts';
import {
  connectionDrops,
  connectionReturns,
  fakeApi,
  newId,
  relaunch,
  requestsTo,
  resetDevice,
  saveToDisk,
  shutDown,
  signInAs,
  startApp,
  waitFor,
  write,
} from '../../test/app.ts';

/// Fixing what was typed wrong at the gym - usually in the same basement the set was
/// logged in. A correction has to show on screen at once, reach the server once, and
/// never overtake the write that created what it corrects.

const USER = 'alice';
const BENCH_PRESS = 'a1b2c3d4-0001-0000-0000-000000000000';

beforeEach(async () => {
  await resetDevice();
  await signInAs(USER);
});

after(shutDown);

const session = (overrides: Partial<WorkoutResponse> = {}): WorkoutResponse => ({
  id: newId(),
  name: 'Push',
  performedAt: '2026-10-21',
  notes: null,
  planDayId: null,
  planDayName: null,
  exercises: [],
  ...overrides,
});

const benchWith = (sets: { id: string; weightKg: number; reps: number }[]) => ({
  id: newId(),
  exerciseId: BENCH_PRESS,
  exerciseName: 'Wyciskanie',
  category: null,
  targetSets: null,
  targetReps: null,
  restSeconds: null,
  orderIndex: 0,
  sets: sets.map((set, orderIndex) => ({ ...set, orderIndex })),
  lastPerformance: null,
});

/// The optimistic patch lands a moment after the write is issued: onMutate first calls off
/// any refetch in the air.
const patched = (condition: () => boolean) => waitFor(condition, 'the cache shows the write');

const settled = (app: ReturnType<typeof startApp>) =>
  waitFor(
    () => app.getMutationCache().getAll().every((m) => m.state.status === 'success'),
    'every queued write has landed',
  );

describe('correcting a set', () => {
  test('shows at once offline, and three fixes of one set go out as one request', async () => {
    const setId = newId();
    const workout = session({ exercises: [benchWith([{ id: setId, weightKg: 100, reps: 5 }])] });

    connectionDrops();
    const app = startApp();
    app.setQueryData(getGetApiWorkoutsWorkoutIdQueryKey(workout.id), workout);

    for (const weightKg of [10, 102, 102.5]) {
      write(app, getPutApiExercisesSetsSetIdMutationOptions, { setId, data: { weightKg, reps: 4 } });
    }

    const onScreen = () =>
      app.getQueryData<WorkoutResponse>(getGetApiWorkoutsWorkoutIdQueryKey(workout.id))!.exercises[0].sets;
    await patched(() => onScreen()[0].weightKg === 102.5);
    assert.deepEqual(onScreen().map((s) => [s.weightKg, s.reps]), [[102.5, 4]]);

    connectionReturns();
    await settled(app);

    const sent = requestsTo('PUT', `/api/Exercises/sets/${setId}`);
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].body, { weightKg: 102.5, reps: 4 });
  });

  test('a set logged and deleted offline is created first, then deleted', async () => {
    const workout = session({ exercises: [benchWith([])] });
    const exerciseId = workout.exercises[0].id;
    const setId = newId();

    connectionDrops();
    const app = startApp();
    app.setQueryData(getGetApiWorkoutsWorkoutIdQueryKey(workout.id), workout);

    write(app, getPostApiExercisesWorkoutExerciseIdSetsMutationOptions, {
      workoutExerciseId: exerciseId,
      data: { id: setId, weightKg: 100, reps: 5, orderIndex: 0 },
    });
    write(app, getDeleteApiExercisesSetsSetIdMutationOptions, { setId });

    const onScreen = () =>
      app.getQueryData<WorkoutResponse>(getGetApiWorkoutsWorkoutIdQueryKey(workout.id))!.exercises[0].sets;
    // Logged, then gone again.
    await patched(() => app.getMutationCache().getAll().length === 2 && onScreen().length === 0);

    connectionReturns();
    await settled(app);

    assert.deepEqual(
      fakeApi.requests.filter((r) => r.method !== 'GET').map((r) => `${r.method} ${r.path}`),
      [`POST /api/Exercises/${exerciseId}/sets`, `DELETE /api/Exercises/sets/${setId}`],
    );
  });

  test('a correction queued when the app was killed is sent after the relaunch', async () => {
    // Without a registered default the resumed write would fail with "No mutationFn
    // found" and be reported as lost.
    const setId = newId();

    connectionDrops();
    const app = startApp();
    write(app, getPutApiExercisesSetsSetIdMutationOptions, { setId, data: { weightKg: 90, reps: 8 } });
    await saveToDisk(app, USER);

    connectionReturns();
    const next = await relaunch(USER);
    await settled(next);

    assert.equal(requestsTo('PUT', `/api/Exercises/sets/${setId}`).length, 1);
  });
});

describe('removing from a session', () => {
  test('an exercise disappears from the session at once', async () => {
    const workout = session({ exercises: [benchWith([{ id: newId(), weightKg: 100, reps: 5 }])] });
    const workoutExerciseId = workout.exercises[0].id;

    connectionDrops();
    const app = startApp();
    app.setQueryData(getGetApiWorkoutsWorkoutIdQueryKey(workout.id), workout);

    write(app, getDeleteApiWorkoutsExercisesWorkoutExerciseIdMutationOptions, { workoutExerciseId });

    await patched(
      () => app.getQueryData<WorkoutResponse>(getGetApiWorkoutsWorkoutIdQueryKey(workout.id))!.exercises.length === 0,
    );

    connectionReturns();
    await settled(app);
    assert.equal(requestsTo('DELETE', `/api/Workouts/exercises/${workoutExerciseId}`).length, 1);
  });

  test('a deleted session leaves today and the calendar month at once', async () => {
    const workout = session();
    const todayKey = getGetApiWorkoutsUserIdByDateQueryKey(USER, { date: workout.performedAt });
    const monthKey = getGetApiWorkoutsUserIdByMonthQueryKey(USER, { year: 2026, month: 10 });
    const other: WorkoutSummaryResponse = {
      id: newId(), name: 'Pull', performedAt: '2026-10-19', exerciseCount: 3, planDayId: null, planDayName: null,
    };

    connectionDrops();
    const app = startApp();
    app.setQueryData<WorkoutByDateResponse>(todayKey, {
      id: workout.id, name: workout.name, performedAt: workout.performedAt,
      exerciseCount: 0, planDayId: null, planDayName: null,
    });
    app.setQueryData<WorkoutSummaryResponse[]>(monthKey, [
      { id: workout.id, name: workout.name, performedAt: workout.performedAt, exerciseCount: 0, planDayId: null, planDayName: null },
      other,
    ]);

    write(app, getDeleteApiWorkoutsWorkoutIdMutationOptions, { workoutId: workout.id });

    await patched(() => app.getQueryData(todayKey) === null);
    assert.deepEqual(app.getQueryData(monthKey), [other]);

    connectionReturns();
    await settled(app);
    assert.equal(requestsTo('DELETE', `/api/Workouts/${workout.id}`).length, 1);
  });
});

describe('last time', () => {
  test('a session started offline from a day copies the hint, preferring a newer session on the phone', async () => {
    const dayId = newId();
    const rowId = newId();
    const day: PlanDayResponse = {
      id: dayId, planId: newId(), name: 'Push', notes: null, orderIndex: 0, hasBeenPerformed: true,
      exercises: [{
        id: rowId, exerciseId: BENCH_PRESS, exerciseName: 'Wyciskanie', category: null,
        targetSets: 3, targetReps: 8, restSeconds: 120, orderIndex: 0,
        // What the server knew when the day was last fetched.
        lastPerformance: { performedAt: '2026-10-07', sets: [{ weightKg: 80, reps: 8 }] },
      }],
    };
    // Logged offline last week and never seen by the server's answer above.
    const lastWeek = session({
      performedAt: '2026-10-14',
      exercises: [benchWith([{ id: newId(), weightKg: 85, reps: 8 }])],
    });
    // Dated after the new session, so it must not count as "last time".
    const later = session({
      performedAt: '2026-10-25',
      exercises: [benchWith([{ id: newId(), weightKg: 999, reps: 1 }])],
    });

    connectionDrops();
    const app = startApp();
    app.setQueryData(getGetApiTrainingPlansDaysDayIdQueryKey(dayId), day);
    app.setQueryData(getGetApiWorkoutsWorkoutIdQueryKey(lastWeek.id), lastWeek);
    app.setQueryData(getGetApiWorkoutsWorkoutIdQueryKey(later.id), later);

    const workoutId = newId();
    write(app, getPostApiWorkoutsFromPlanDayMutationOptions, {
      data: { id: workoutId, planDayId: dayId, performedAt: '2026-10-21', exerciseIds: [{ planDayExerciseId: rowId, workoutExerciseId: newId() }] },
    });

    const started = () => app.getQueryData<WorkoutResponse>(getGetApiWorkoutsWorkoutIdQueryKey(workoutId));
    await patched(() => started() !== undefined);
    assert.deepEqual(started()?.exercises[0].lastPerformance, {
      performedAt: '2026-10-14',
      sets: [{ weightKg: 85, reps: 8 }],
    });
  });

  const pushDay = (lastPerformance: PlanDayResponse['exercises'][number]['lastPerformance']) => {
    const rowId = newId();
    const day: PlanDayResponse = {
      id: newId(), planId: newId(), name: 'Push', notes: null, orderIndex: 0, hasBeenPerformed: true,
      exercises: [{
        id: rowId, exerciseId: BENCH_PRESS, exerciseName: 'Wyciskanie', category: null,
        targetSets: 3, targetReps: 8, restSeconds: 120, orderIndex: 0, lastPerformance,
      }],
    };
    return { day, rowId };
  };

  const startFrom = async (app: ReturnType<typeof startApp>, day: PlanDayResponse, rowId: string) => {
    const workoutId = newId();
    write(app, getPostApiWorkoutsFromPlanDayMutationOptions, {
      data: { id: workoutId, planDayId: day.id, performedAt: '2026-10-21', exerciseIds: [{ planDayExerciseId: rowId, workoutExerciseId: newId() }] },
    });
    const started = () => app.getQueryData<WorkoutResponse>(getGetApiWorkoutsWorkoutIdQueryKey(workoutId));
    await patched(() => started() !== undefined);
    return started()!.exercises[0].lastPerformance;
  };

  test('a deleted session is no longer last time', async () => {
    // Logged by mistake, opened, deleted. Neither its cached detail nor the day's copy of
    // it may feed the hint afterwards.
    const mistake = session({
      performedAt: '2026-10-14',
      exercises: [benchWith([{ id: newId(), weightKg: 150, reps: 5 }])],
    });
    const { day, rowId } = pushDay({ performedAt: '2026-10-14', sets: [{ weightKg: 150, reps: 5 }] });

    connectionDrops();
    const app = startApp();
    app.setQueryData(getGetApiTrainingPlansDaysDayIdQueryKey(day.id), day);
    app.setQueryData(getGetApiWorkoutsWorkoutIdQueryKey(mistake.id), mistake);

    write(app, getDeleteApiWorkoutsWorkoutIdMutationOptions, { workoutId: mistake.id });
    await patched(() => app.getQueryData(getGetApiWorkoutsWorkoutIdQueryKey(mistake.id)) === undefined);

    assert.equal(await startFrom(app, day, rowId), null);
  });

  test('a corrected set wins over the day\'s older copy of the same session', async () => {
    const setId = newId();
    const monday = session({
      performedAt: '2026-10-14',
      exercises: [benchWith([{ id: setId, weightKg: 100, reps: 5 }])],
    });
    const { day, rowId } = pushDay({ performedAt: '2026-10-14', sets: [{ weightKg: 100, reps: 5 }] });

    connectionDrops();
    const app = startApp();
    app.setQueryData(getGetApiTrainingPlansDaysDayIdQueryKey(day.id), day);
    app.setQueryData(getGetApiWorkoutsWorkoutIdQueryKey(monday.id), monday);

    write(app, getPutApiExercisesSetsSetIdMutationOptions, { setId, data: { weightKg: 80, reps: 5 } });
    await patched(
      () => app.getQueryData<WorkoutResponse>(getGetApiWorkoutsWorkoutIdQueryKey(monday.id))!.exercises[0].sets[0].weightKg === 80,
    );

    assert.deepEqual(await startFrom(app, day, rowId), {
      performedAt: '2026-10-14',
      sets: [{ weightKg: 80, reps: 5 }],
    });
  });
});
