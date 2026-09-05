/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { EXPIRY_MARGIN_MS, needsRefresh } from './refreshPolicy.ts';

const NOW = 1_700_000_000_000;

describe('needsRefresh', () => {
  test('leaves a token with plenty of life alone', () => {
    assert.equal(needsRefresh(NOW + 60 * 60_000, NOW), false);
  });

  test('refreshes once the token is inside the margin', () => {
    assert.equal(needsRefresh(NOW + EXPIRY_MARGIN_MS - 1, NOW), true);
  });

  test('refreshes a token that already expired', () => {
    assert.equal(needsRefresh(NOW - 1, NOW), true);
  });

  test('treats a session stored before expiry was tracked as needing a refresh', () => {
    // Sessions saved by an older build have no expiry, which reads back as 0. It has
    // to mean "refresh on next use" - reading it as "invalid session" would sign out
    // every existing user the moment they update the app.
    assert.equal(needsRefresh(0, NOW), true);
  });
});
