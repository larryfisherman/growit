/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { getGetApiTrainingPlansDaysDayIdQueryKey } from '../../api/generated/training-plans/training-plans.ts';
import type { PlanDayResponse } from '../../api/generated/schemas/index.ts';
import { planDaySessionCopy } from './planDayAssignments.ts';

const BENCH_PRESS = 'a1b2c3d4-0001-0000-0000-000000000000';

const day: PlanDayResponse = {
  id: 'day-1',
  planId: 'plan-1',
  name: 'Push',
  notes: null,
  orderIndex: 0,
  hasBeenPerformed: false,
  exercises: [
    { id: 'row-1', exerciseId: BENCH_PRESS, exerciseName: 'Wyciskanie', category: null, targetSets: 5, targetReps: 5, restSeconds: 180, orderIndex: 0 },
    { id: 'row-2', exerciseId: null, exerciseName: 'Moje ćwiczenie', category: null, targetSets: 3, targetReps: 12, restSeconds: 60, orderIndex: 1 },
  ],
};

describe('planDaySessionCopy', () => {
  test('sends the session as the phone shows it, under the ids sets will be logged into', () => {
    const client = new QueryClient();
    client.setQueryData(getGetApiTrainingPlansDaysDayIdQueryKey(day.id), day);

    const copy = planDaySessionCopy(client, day.id);

    assert.equal(copy.name, 'Push');
    assert.equal(copy.exercises?.length, 2);
    // The same id on both sides: the mapping from the plan row and the copied row.
    assert.deepEqual(
      copy.exercises?.map((e) => e.workoutExerciseId),
      copy.exerciseIds?.map((a) => a.workoutExerciseId),
    );
    assert.deepEqual(copy.exercises?.[0], {
      workoutExerciseId: copy.exerciseIds?.[0].workoutExerciseId,
      exerciseId: BENCH_PRESS,
      customExerciseName: null,
      targetSets: 5,
      targetReps: 5,
      restSeconds: 180,
      orderIndex: 0,
    });
    assert.equal(copy.exercises?.[1].customExerciseName, 'Moje ćwiczenie');
  });

  test('sends nothing to copy when the day was never opened', () => {
    assert.deepEqual(planDaySessionCopy(new QueryClient(), 'unknown-day'), {
      exerciseIds: null,
      name: null,
      exercises: null,
    });
  });
});
