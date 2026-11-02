/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { PlanDayExerciseResponse, PlanDayResponse } from '../../api/generated/schemas/index.ts';
import { DEFAULT_TARGETS } from './constants.ts';
import {
  needsRemovalConfirm,
  toDayExercises,
  toSelection,
  type PickerSnapshot,
} from './exercisePicks.ts';

const BENCH_PRESS = 'a1b2c3d4-0001-0000-0000-000000000000';
const SQUAT = 'a1b2c3d4-0002-0000-0000-000000000000';

const benchRow: PlanDayExerciseResponse = {
  id: 'row-bench',
  exerciseId: BENCH_PRESS,
  exerciseName: 'Wyciskanie',
  category: 'Klatka',
  targetSets: 5,
  targetReps: 5,
  restSeconds: 180,
  orderIndex: 0,
  lastPerformance: null,
};

const customRow: PlanDayExerciseResponse = {
  id: 'row-custom',
  exerciseId: null,
  exerciseName: 'Moje ćwiczenie',
  category: null,
  targetSets: 3,
  targetReps: 12,
  restSeconds: 60,
  orderIndex: 1,
  lastPerformance: null,
};

const day: PlanDayResponse = {
  id: 'day-1',
  planId: 'plan-1',
  name: 'Push',
  notes: null,
  orderIndex: 0,
  hasBeenPerformed: false,
  exercises: [benchRow, customRow],
};

describe('toDayExercises', () => {
  test('an existing pick resolves to its live row with the new position', () => {
    const [row] = toDayExercises([{ kind: 'existing', row: { ...benchRow, targetSets: 1 } }], {
      ...day,
      exercises: [{ ...benchRow, orderIndex: 4 }],
    });

    assert.deepEqual(row, { ...benchRow, orderIndex: 0 });
  });

  test('a library pick matching a row the day already has reuses that row and its targets', () => {
    const [, row] = toDayExercises(
      [
        { kind: 'custom', rowId: 'fresh-custom', name: 'Inne' },
        { kind: 'library', rowId: 'fresh-bench', exerciseId: BENCH_PRESS, name: 'Wyciskanie', category: 'Klatka' },
      ],
      day,
    );

    assert.equal(row.id, 'row-bench');
    assert.equal(row.targetSets, 5);
    assert.equal(row.targetReps, 5);
    assert.equal(row.restSeconds, 180);
    assert.equal(row.orderIndex, 1);
  });

  test('a fresh custom pick gets the default targets under its minted row id', () => {
    const [row] = toDayExercises([{ kind: 'custom', rowId: 'fresh-custom', name: 'Pompki' }], day);

    assert.deepEqual(row, {
      id: 'fresh-custom',
      exerciseId: null,
      exerciseName: 'Pompki',
      category: null,
      targetSets: DEFAULT_TARGETS.sets,
      targetReps: DEFAULT_TARGETS.reps,
      restSeconds: DEFAULT_TARGETS.restSeconds,
      orderIndex: 0,
      lastPerformance: null,
    });
  });
});

describe('toSelection', () => {
  test('a library row is sent by exercise id, without a custom name', () => {
    assert.deepEqual(toSelection(benchRow), {
      planDayExerciseId: 'row-bench',
      exerciseId: BENCH_PRESS,
      customExerciseName: null,
    });
  });

  test('a custom row is sent by its name', () => {
    assert.deepEqual(toSelection(customRow), {
      planDayExerciseId: 'row-custom',
      exerciseId: null,
      customExerciseName: 'Moje ćwiczenie',
    });
  });
});

describe('needsRemovalConfirm', () => {
  const defaultSquat: PlanDayExerciseResponse = {
    ...benchRow,
    id: 'row-squat',
    exerciseId: SQUAT,
    exerciseName: 'Przysiad',
    targetSets: DEFAULT_TARGETS.sets,
    targetReps: DEFAULT_TARGETS.reps,
    restSeconds: DEFAULT_TARGETS.restSeconds,
  };

  const snapshot = (performed: boolean): PickerSnapshot => ({
    initialByExerciseId: new Map([
      [BENCH_PRESS, benchRow],
      [SQUAT, defaultSquat],
    ]),
    performed,
  });

  test('a pick made in this session goes silently', () => {
    assert.equal(needsRemovalConfirm(snapshot(true), new Set(), 'not-on-the-day'), false);
  });

  test('an exercise already confirmed for removal goes silently', () => {
    assert.equal(needsRemovalConfirm(snapshot(true), new Set([BENCH_PRESS]), BENCH_PRESS), false);
  });

  test('default targets on a day never performed go silently', () => {
    assert.equal(needsRemovalConfirm(snapshot(false), new Set(), SQUAT), false);
  });

  test('a performed day asks first, even for default targets', () => {
    assert.equal(needsRemovalConfirm(snapshot(true), new Set(), SQUAT), true);
  });

  test('tuned targets ask first', () => {
    assert.equal(needsRemovalConfirm(snapshot(false), new Set(), BENCH_PRESS), true);
  });
});
