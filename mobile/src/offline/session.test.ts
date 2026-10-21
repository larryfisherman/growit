/// <reference types="node" />
import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import type { QueryClient } from '@tanstack/react-query';
import { getPostApiTrainingPlansMutationOptions } from '../api/generated/training-plans/training-plans.ts';
import {
  connectionDrops,
  connectionReturns,
  fakeApi,
  fakeCognito,
  getLostWriteCount,
  newId,
  relaunch,
  resetDevice,
  saveToDisk,
  shutDown,
  signInAs,
  signOutLocally,
  sleep,
  startApp,
  stopApp,
  tokenOf,
  waitFor,
  write,
} from '../../test/app.ts';

/// Sessions and the queue. A write belongs to the user who made it: it must not be lost
/// because a token could not be refreshed, and it must never be sent as somebody else.

const createPlan = (app: QueryClient, id: string) =>
  write(app, getPostApiTrainingPlansMutationOptions, { data: { id, name: 'Plan', notes: null } });

const createsOf = (id: string) =>
  fakeApi.requests.filter((r) => r.method === 'POST' && r.path === '/api/training-plans' && r.body?.id === id);

beforeEach(resetDevice);
after(shutDown);

describe('a token that cannot be refreshed right now', () => {
  test('a 401 while Cognito is unreachable keeps the write, which lands once a token is issued', async () => {
    // Close to expiry, so the request path tries to refresh first - and cannot.
    await signInAs('alice', { expiresInMs: 10_000 });
    fakeCognito.mode = 'unreachable';
    fakeApi.respondWith((request) =>
      request.authorization === `Bearer ${tokenOf('alice')}`
        ? { status: 401 }
        : { status: 200, body: {} },
    );

    const app = startApp();
    const id = newId();
    const mutation = createPlan(app, id);

    await waitFor(() => createsOf(id).length >= 1, 'the stale token was tried');
    await sleep(1_500);

    assert.equal(getLostWriteCount(), 0, 'the write must not be reported lost');
    assert.notEqual(mutation.state.status, 'error', 'the write must still be queued');

    // The link recovers and Cognito answers again.
    fakeCognito.mode = 'issues';
    connectionDrops();
    connectionReturns();

    await waitFor(
      () => createsOf(id).some((r) => r.authorization?.startsWith('Bearer refreshed-alice')),
      'the write is sent with the refreshed token',
      10_000,
    );
  });
});

describe('signing out with writes still queued', () => {
  test('the previous user\'s client sends nothing more once it is torn down', async () => {
    await signInAs('alice');

    let releaseFirst: (reply: { status: number }) => void = () => {};
    fakeApi.respondWith((request) =>
      request.body?.id === ids[0]
        ? new Promise((resolve) => (releaseFirst = resolve))
        : { status: 200, body: {} },
    );

    const app = startApp();
    const ids = [newId(), newId(), newId()];
    ids.forEach((id) => createPlan(app, id));
    await waitFor(() => fakeApi.requests.length === 1, 'the first write is on the wire');

    // Sign-out as AuthContext does it, then someone else signs in on the same phone.
    await saveToDisk(app, 'alice');
    stopApp(app);
    await signOutLocally();
    await signInAs('bob');

    releaseFirst({ status: 200 });
    await sleep(1_500);

    const sentAsBob = fakeApi.requests.filter((r) => r.authorization === `Bearer ${tokenOf('bob')}`);
    assert.equal(sentAsBob.length, 0, 'alice\'s writes must never go out with bob\'s token');
    assert.equal(fakeApi.requests.length, 1, 'a torn-down client must not keep draining its queue');
  });

  test('every write the user left behind is sent when that same user signs back in', async () => {
    await signInAs('alice');

    // The first write is cut off mid-flight by the sign-out.
    fakeApi.respondWith(() => new Promise(() => {}));

    const app = startApp();
    const ids = [newId(), newId(), newId()];
    ids.forEach((id) => createPlan(app, id));
    await waitFor(() => fakeApi.requests.length === 1, 'the first write is on the wire');

    await saveToDisk(app, 'alice');
    stopApp(app);
    await signOutLocally();
    fakeApi.dropConnections();

    fakeApi.respondWith(() => ({ status: 200, body: {} }));
    await signInAs('alice');
    await relaunch('alice');

    await waitFor(
      () => ids.every((id) => createsOf(id).some((r) => r.authorization === `Bearer ${tokenOf('alice')}`)),
      'all three of alice\'s writes reach the server as alice',
      8_000,
    );
  });
});
