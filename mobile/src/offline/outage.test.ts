/// <reference types="node" />
import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import { getPostApiTrainingPlansMutationOptions } from '../api/generated/training-plans/training-plans.ts';
import {
  connectionReturns,
  fakeApi,
  getLostWriteCount,
  newId,
  resetDevice,
  shutDown,
  signInAs,
  sleep,
  startApp,
  waitFor,
  write,
} from '../../test/app.ts';

/// The phone is fine, the server is not. A deploy, a restarting container or a gateway
/// with nothing behind it answers 502/503/504 for a while - that is the backend being
/// away, not refusing the write, and it must be treated like a lost link.

beforeEach(async () => {
  await resetDevice();
  await signInAs('alice');
});

after(shutDown);

describe('the backend is temporarily down', () => {
  test('writes made during a 503 outage are kept and land when the server is back', async () => {
    // Four in a row: longer than a server error is given (three retries), so this only
    // passes if an outage is waited out rather than counted against the write.
    let answered = 0;
    fakeApi.respondWith(() => (++answered <= 4 ? { status: 503 } : { status: 200, body: {} }));

    const app = startApp();
    const mutation = write(app, getPostApiTrainingPlansMutationOptions, {
      data: { id: newId(), name: 'Plan', notes: null },
    });

    // Plays the part of the health probe: whenever the app has stopped trying, the
    // server is reported back.
    const deadline = Date.now() + 30_000;
    while (mutation.state.status !== 'success') {
      assert.notEqual(mutation.state.status, 'error', 'a write must not be dropped because the server was down');
      assert.ok(Date.now() < deadline, 'the write never landed');
      if (mutation.state.isPaused) connectionReturns();
      await sleep(100);
    }

    assert.equal(getLostWriteCount(), 0);
  });

  test('a server that keeps failing with 500 is still given up on, and the loss is reported', async () => {
    // A bug rather than an outage: retrying forever would block every write behind it.
    fakeApi.respondWith(() => ({ status: 500 }));

    const app = startApp();
    const mutation = write(app, getPostApiTrainingPlansMutationOptions, {
      data: { id: newId(), name: 'Plan', notes: null },
    });

    await waitFor(() => mutation.state.status === 'error', 'the write is given up on', 20_000);
    assert.equal(getLostWriteCount(), 1);
  });
});
