/// <reference types="node" />
import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import { getPostApiTrainingPlansMutationOptions } from '../api/generated/training-plans/training-plans.ts';
import { authMutationOptions } from '../auth/authMutationOptions.ts';
import { CognitoRejection } from '../auth/cognito.ts';
import {
  fakeApi,
  getLostWriteCount,
  newId,
  resetDevice,
  shutDown,
  signInAs,
  startApp,
  waitFor,
  write,
} from '../../test/app.ts';

/// The red "Nie zapisano zmiany" banner is a promise: it appears when, and only when,
/// something the user changed did not make it to the server. Raising it for anything
/// else teaches people to ignore it.

beforeEach(resetDevice);
after(shutDown);

describe('the lost-write banner', () => {
  test('a wrong password is not a lost write', async () => {
    // Signed out: the client the auth screens run on.
    const app = startApp();
    const signIn = app.getMutationCache().build(app, {
      ...authMutationOptions,
      mutationFn: () =>
        Promise.reject(new CognitoRejection('Incorrect username or password.', 'NotAuthorizedException', 400)),
    } as never);

    await signIn.execute(undefined as never).catch(() => undefined);

    assert.equal(getLostWriteCount(), 0);
  });

  test('a write the server refuses is reported', async () => {
    await signInAs('alice');
    fakeApi.respondWith(() => ({ status: 400 }));

    const app = startApp();
    const mutation = write(app, getPostApiTrainingPlansMutationOptions, {
      data: { id: newId(), name: 'Plan', notes: null },
    });

    await waitFor(() => mutation.state.status === 'error', 'the refusal came back');
    assert.equal(getLostWriteCount(), 1);
  });
});
