/// <reference types="node" />
import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import type { QueryClient } from '@tanstack/react-query';
import { getPostApiTrainingPlansMutationOptions } from '../api/generated/training-plans/training-plans.ts';
import {
  connectionDrops,
  connectionReturns,
  fakeApi,
  newId,
  relaunch,
  resetDevice,
  saveToDisk,
  shutDown,
  signInAs,
  sleep,
  startApp,
  stopApp,
  storage,
  tokenOf,
  waitFor,
  write,
} from '../../test/app.ts';

/// What survives the app being killed. A write the user made is theirs until the server
/// has it: closing the app, the OS reclaiming it, or an update must never be the reason
/// it disappears.

const USER = 'alice';

const createPlan = (app: QueryClient, id: string) =>
  write(app, getPostApiTrainingPlansMutationOptions, { data: { id, name: 'Plan', notes: null } });

const createsOf = (id: string) =>
  fakeApi.requests.filter((r) => r.method === 'POST' && r.path === '/api/training-plans' && r.body?.id === id);

const createdInOrder = () =>
  fakeApi.requests
    .filter((r) => r.method === 'POST' && r.path === '/api/training-plans')
    .map((r) => r.body.id);

beforeEach(async () => {
  await resetDevice();
  await signInAs(USER);
});

after(shutDown);

describe('the write queue across a restart', () => {
  test('writes made offline are sent after a relaunch, in the order they were made', async () => {
    connectionDrops();
    const app = startApp();
    const ids = [newId(), newId(), newId()];
    ids.forEach((id) => createPlan(app, id));

    await saveToDisk(app, USER);
    stopApp(app);

    connectionReturns();
    await relaunch(USER);

    await waitFor(() => createdInOrder().length === 3, 'all three creates reach the server');
    assert.deepEqual(createdInOrder(), ids);
  });

  test('a write that was on the wire when the app was killed is sent again after relaunch', async () => {
    // The first attempt never gets an answer: the app is killed while it is in the air.
    let first = true;
    fakeApi.respondWith(() => {
      if (first) {
        first = false;
        return new Promise(() => {});
      }
      return { status: 200, body: {} };
    });

    const app = startApp();
    const id = newId();
    createPlan(app, id);
    await waitFor(() => createsOf(id).length === 1, 'the first attempt is on the wire');

    await saveToDisk(app, USER);
    stopApp(app);

    await relaunch(USER);

    await waitFor(
      () => createsOf(id).length === 2,
      'the interrupted create is sent again by the relaunched app',
    );
  });

  test('a write waiting to be retried when the app was killed is sent after relaunch', async () => {
    let attempts = 0;
    fakeApi.respondWith(() => (++attempts === 1 ? { status: 503 } : { status: 200, body: {} }));

    const app = startApp();
    const id = newId();
    createPlan(app, id);
    await waitFor(() => createsOf(id).length === 1, 'the first attempt was answered with 503');

    // Killed during the back-off before the retry. The old client is frozen offline
    // until its back-off has run out, so whatever reaches the server afterwards can only
    // come from the relaunched app.
    await saveToDisk(app, USER);
    connectionDrops();
    stopApp(app);
    await sleep(1_500);

    await relaunch(USER);
    connectionReturns();

    await waitFor(() => createsOf(id).length === 2, 'the relaunched app retries the create');
  });

  test('an app update that changes the cache version keeps the unsent writes', async () => {
    connectionDrops();
    const app = startApp();
    const id = newId();
    createPlan(app, id);
    await saveToDisk(app, USER);
    stopApp(app);

    // What the previous version of the app left on disk.
    const key = `growit.rq.${USER}`;
    const stored = JSON.parse(storage.get(key)!);
    storage.set(key, JSON.stringify({ ...stored, buster: 'an-older-version' }));

    connectionReturns();
    await relaunch(USER);

    await waitFor(() => createsOf(id).length === 1, 'the write queued before the update is sent');
  });
});

describe('what is written to the device', () => {
  test('the access token never ends up in storage, even inside a failed attempt', async () => {
    fakeApi.respondWith(() => ({ drop: true }));

    const app = startApp();
    const write = createPlan(app, newId());
    await waitFor(() => fakeApi.requests.length >= 1, 'the first attempt failed on transport');

    connectionDrops();
    await waitFor(() => write.state.isPaused, 'the write is queued until the link returns', 5_000);
    await saveToDisk(app, USER);

    const onDisk = storage.get(`growit.rq.${USER}`) ?? '';
    assert.ok(onDisk.length > 0, 'the queue was written');
    assert.ok(!onDisk.includes(tokenOf(USER)), 'the bearer token must not be persisted');
  });
});
