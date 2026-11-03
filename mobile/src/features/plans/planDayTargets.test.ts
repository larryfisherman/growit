/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { parsePlanDayTargets } from './planDayTargets.ts';

describe('plan-day targets typed by the user', () => {
  test('are read when they make sense', () => {
    assert.deepEqual(parsePlanDayTargets({ sets: '4', reps: '8', rest: '0' }), {
      targetSets: 4,
      targetReps: 8,
      restSeconds: 0,
    });
  });

  test('are refused when a count is negative or zero', () => {
    assert.equal(parsePlanDayTargets({ sets: '-3', reps: '8', rest: '90' }), null);
    assert.equal(parsePlanDayTargets({ sets: '3', reps: '-8', rest: '90' }), null);
    assert.equal(parsePlanDayTargets({ sets: '0', reps: '8', rest: '90' }), null);
  });

  test('are refused when the rest is negative or missing', () => {
    assert.equal(parsePlanDayTargets({ sets: '3', reps: '8', rest: '-5' }), null);
    assert.equal(parsePlanDayTargets({ sets: '3', reps: '8', rest: '' }), null);
  });
});
