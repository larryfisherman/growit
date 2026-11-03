/// <reference types="node" />
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { formatDayMonth } from './date.ts';

describe('formatting a day and month', () => {
  const originalTz = process.env.TZ;
  after(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  test('keeps a date-only string on its own calendar day west of UTC', () => {
    // Read as UTC midnight, 3 November is still 2 November in New York.
    process.env.TZ = 'America/New_York';
    assert.equal(formatDayMonth('2026-11-03'), '3 listopada');
  });

  test('keeps a date-only string on its own calendar day east of UTC', () => {
    process.env.TZ = 'Asia/Tokyo';
    assert.equal(formatDayMonth('2026-11-03'), '3 listopada');
  });
});
