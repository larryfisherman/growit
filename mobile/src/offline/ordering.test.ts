/// <reference types="node" />
import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import { QueryObserver } from '@tanstack/react-query';
import {
  getGetApiTrainingPlansPlanIdQueryOptions,
  getPostApiTrainingPlansPlanIdDaysMutationOptions,
  getPutApiTrainingPlansDaysDayIdExercisesMutationOptions,
  getPutApiTrainingPlansExercisesPlanDayExerciseIdMutationOptions,
  getPutApiTrainingPlansPlanIdActiveMutationOptions,
} from '../api/generated/training-plans/training-plans.ts';
import type { TrainingPlanResponse } from '../api/generated/schemas/index.ts';
import {
  connectionDrops,
  connectionReturns,
  fakeApi,
  newId,
  resetDevice,
  shutDown,
  signInAs,
  sleep,
  startApp,
  waitFor,
  write,
} from '../../test/app.ts';

/// Writes depend on each other: a row has to exist before it can be edited, a day before
/// a session can start from it. Whatever the queue does to save requests, it must never
/// send a write ahead of the one that creates what it points at - and what the user sees
/// while the queue drains must not jump backwards.

const BENCH_PRESS = 'a1b2c3d4-0001-0000-0000-000000000000';
const DEADLIFT = 'a1b2c3d4-0004-0000-0000-000000000000';

beforeEach(async () => {
  await resetDevice();
  await signInAs('alice');
});

after(shutDown);

describe('coalescing', () => {
  test('replacing a day\'s exercise list never moves it behind edits to the rows it creates', async () => {
    const dayId = newId();
    const benchRow = newId();
    const deadliftRow = newId();
    const pick = (planDayExerciseId: string, exerciseId: string) => ({
      planDayExerciseId,
      exerciseId,
      customExerciseName: null,
    });

    connectionDrops();
    const app = startApp();

    // Pick bench press, tune it, then add a deadlift - all on the train.
    write(app, getPutApiTrainingPlansDaysDayIdExercisesMutationOptions, {
      dayId,
      data: { exercises: [pick(benchRow, BENCH_PRESS)] },
    });
    write(app, getPutApiTrainingPlansExercisesPlanDayExerciseIdMutationOptions, {
      planDayExerciseId: benchRow,
      data: { targetSets: 5, targetReps: 5, restSeconds: 180, orderIndex: 0 },
    });
    write(app, getPutApiTrainingPlansDaysDayIdExercisesMutationOptions, {
      dayId,
      data: { exercises: [pick(benchRow, BENCH_PRESS), pick(deadliftRow, DEADLIFT)] },
    });

    connectionReturns();
    await waitFor(
      () => app.getMutationCache().getAll().every((m) => m.state.status === 'success'),
      'every queued write has landed',
    );

    const paths = fakeApi.requests.map((r) => `${r.method} ${r.path}`);
    const firstListWithBench = fakeApi.requests.findIndex(
      (r) =>
        r.method === 'PUT' &&
        r.path === `/api/training-plans/days/${dayId}/exercises` &&
        r.body.exercises.some((e: { planDayExerciseId: string }) => e.planDayExerciseId === benchRow),
    );
    const benchEdit = paths.indexOf(`PUT /api/training-plans/exercises/${benchRow}`);

    assert.ok(firstListWithBench >= 0, 'the day list was sent');
    assert.ok(
      firstListWithBench < benchEdit,
      `the row must be created before it is edited, got: ${paths.join(' -> ')}`,
    );
  });
});

describe('the optimistic view while the queue drains', () => {
  test('a write still queued keeps its change on screen while earlier writes land and refetch', async () => {
    const planId = newId();
    const firstDay = newId();
    const secondDay = newId();

    const serverPlan: TrainingPlanResponse = { id: planId, name: 'Plan', notes: null, isActive: true, days: [] };
    fakeApi.respondWith((request) => {
      if (request.method === 'GET' && request.path === `/api/training-plans/${planId}`) {
        return { status: 200, body: serverPlan };
      }
      if (request.method === 'POST' && request.path === `/api/training-plans/${planId}/days`) {
        // The second day is still on its way when the first one's refetch comes back.
        if (request.body.id === secondDay) return new Promise(() => {});
        serverPlan.days.push({ id: request.body.id, name: request.body.name, orderIndex: serverPlan.days.length, exerciseCount: 0 });
        return { status: 200, body: {} };
      }
      return { status: 200, body: {} };
    });

    const app = startApp();
    // The plan screen is open.
    const screen = new QueryObserver(app, getGetApiTrainingPlansPlanIdQueryOptions(planId));
    const unsubscribe = screen.subscribe(() => {});
    await waitFor(() => screen.getCurrentResult().isSuccess, 'the plan loaded');

    connectionDrops();
    write(app, getPostApiTrainingPlansPlanIdDaysMutationOptions, { planId, data: { id: firstDay, name: 'Push', notes: null } });
    write(app, getPostApiTrainingPlansPlanIdDaysMutationOptions, { planId, data: { id: secondDay, name: 'Pull', notes: null } });
    await waitFor(() => screen.getCurrentResult().data?.days.length === 2, 'both days show while offline');

    connectionReturns();
    await waitFor(
      () => fakeApi.requests.some((r) => r.body?.id === secondDay),
      'the second day is on the wire',
    );
    // The first day has landed by now (the queue runs one write at a time). Give any
    // refetch it set off the time to come back before looking at the screen.
    await sleep(500);
    await waitFor(() => !screen.getCurrentResult().isFetching, 'nothing is still loading');

    const days = screen.getCurrentResult().data?.days.map((d) => d.id) ?? [];
    unsubscribe();
    assert.deepEqual(days, [firstDay, secondDay], 'the day still on its way must not vanish from the screen');
  });

  test('a day added offline after a deletion takes the next free position, not the count', async () => {
    const planId = newId();
    const kept = newId();
    const added = newId();

    // Days 0 and 1 existed, day 0 was deleted: one day left, at position 1.
    const serverPlan: TrainingPlanResponse = {
      id: planId,
      name: 'Plan',
      notes: null,
      isActive: true,
      days: [{ id: kept, name: 'Pull', orderIndex: 1, exerciseCount: 0 }],
    };
    fakeApi.respondWith((request) => {
      if (request.method === 'GET' && request.path === `/api/training-plans/${planId}`) {
        return { status: 200, body: serverPlan };
      }
      return { status: 200, body: {} };
    });

    const app = startApp();
    const screen = new QueryObserver(app, getGetApiTrainingPlansPlanIdQueryOptions(planId));
    const unsubscribe = screen.subscribe(() => {});
    await waitFor(() => screen.getCurrentResult().isSuccess, 'the plan loaded');

    connectionDrops();
    write(app, getPostApiTrainingPlansPlanIdDaysMutationOptions, { planId, data: { id: added, name: 'Legs', notes: null } });
    await waitFor(() => screen.getCurrentResult().data?.days.length === 2, 'the new day shows while offline');

    const newDay = screen.getCurrentResult().data?.days.find((d) => d.id === added);
    unsubscribe();
    // The server appends after the highest position (2); the count (1) would collide.
    assert.equal(newDay?.orderIndex, 2);
  });
});

describe('activating a plan offline', () => {
  test('flips isActive on every cached plan screen, not only on the list', async () => {
    const wasActive = newId();
    const activated = newId();
    const plan = (id: string, isActive: boolean): TrainingPlanResponse => ({
      id, name: id === activated ? 'Nowy' : 'Stary', notes: null, isActive, days: [],
    });
    fakeApi.respondWith((request) => {
      if (request.method === 'GET' && request.path === `/api/training-plans/${wasActive}`) {
        return { status: 200, body: plan(wasActive, true) };
      }
      if (request.method === 'GET' && request.path === `/api/training-plans/${activated}`) {
        return { status: 200, body: plan(activated, false) };
      }
      return { status: 200, body: {} };
    });

    const app = startApp();
    const screens = [wasActive, activated].map((id) => {
      const observer = new QueryObserver(app, getGetApiTrainingPlansPlanIdQueryOptions(id));
      return { observer, unsubscribe: observer.subscribe(() => {}) };
    });
    await waitFor(() => screens.every((s) => s.observer.getCurrentResult().isSuccess), 'both plans loaded');

    connectionDrops();
    write(app, getPutApiTrainingPlansPlanIdActiveMutationOptions, { planId: activated });
    await waitFor(
      () => screens[1].observer.getCurrentResult().data?.isActive === true,
      'the activated plan shows as active while offline',
    );

    const [old, current] = screens.map((s) => s.observer.getCurrentResult().data?.isActive);
    screens.forEach((s) => s.unsubscribe());
    assert.equal(current, true);
    assert.equal(old, false, 'only one plan is active at a time');
  });
});
