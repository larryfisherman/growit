/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { nextPosition } from './position.ts';

describe('the next position', () => {
  test('is first when the list is empty', () => {
    assert.equal(nextPosition([]), 0);
  });

  test('goes after the highest position, not at the count, once a row was deleted', () => {
    // Rows 0, 1, 2 added, then 0 deleted: the count is 2, which row 2 still holds.
    assert.equal(nextPosition([{ orderIndex: 1 }, { orderIndex: 2 }]), 3);
  });

  test('ignores the order the rows are listed in', () => {
    assert.equal(nextPosition([{ orderIndex: 4 }, { orderIndex: 0 }, { orderIndex: 2 }]), 5);
  });
});
