/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { screenStateOf } from './screenStateOf.ts';

describe('the screen state of a query', () => {
  test('keeps showing cached data when a background refetch fails', () => {
    // TanStack keeps the data on a failed refetch and only flips status to 'error'.
    assert.equal(screenStateOf({ status: 'error', fetchStatus: 'idle', data: { id: 'plan' } }), null);
  });

  test('is an error when the query failed with nothing to show', () => {
    assert.equal(screenStateOf({ status: 'error', fetchStatus: 'idle', data: undefined }), 'error');
  });

  test('is offline when a query that never resolved cannot run', () => {
    assert.equal(screenStateOf({ status: 'pending', fetchStatus: 'paused', data: undefined }), 'offline');
  });

  test('is loading while the first fetch runs', () => {
    assert.equal(screenStateOf({ status: 'pending', fetchStatus: 'fetching', data: undefined }), 'loading');
  });

  test('renders the data once it has arrived', () => {
    assert.equal(screenStateOf({ status: 'success', fetchStatus: 'idle', data: [] }), null);
  });
});
