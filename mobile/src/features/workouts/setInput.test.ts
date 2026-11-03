/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { parseSetInput } from './setInput.ts';

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
