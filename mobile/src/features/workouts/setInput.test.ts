/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { nextSetPosition, parseSetInput } from './setInput.ts';

describe('set input', () => {
  test('takes a comma as the decimal separator', () => {
    assert.deepEqual(parseSetInput('82,5', '8'), { weightKg: 82.5, reps: 8 });
  });

  test('accepts a bodyweight set at zero kilograms', () => {
    assert.deepEqual(parseSetInput('0', '12'), { weightKg: 0, reps: 12 });
  });

  test('is not a set without a weight, or without a rep', () => {
    assert.equal(parseSetInput('', '8'), null);
    assert.equal(parseSetInput('80', '0'), null);
    assert.equal(parseSetInput('80', ''), null);
    assert.equal(parseSetInput('-5', '8'), null);
    assert.equal(parseSetInput('abc', '8'), null);
  });
});

describe('the next set', () => {
  test('goes first when nothing is logged', () => {
    assert.equal(nextSetPosition([]), 0);
  });

  test('goes after the highest position, not at the count, once one was deleted', () => {
    // Sets 0, 1, 2 logged, then 0 deleted: the count is 2, which set 2 still holds.
    assert.equal(nextSetPosition([{ orderIndex: 1 }, { orderIndex: 2 }]), 3);
  });
});
