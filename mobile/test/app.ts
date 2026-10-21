/// <reference types="node" />
import { type Mutation, type QueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/react-query-persist-client';
import { createQueryClient } from '../src/offline/queryClient.ts';
import { persistOptionsFor } from '../src/offline/persistence.ts';
import { forceOffline } from '../src/offline/connectivity.ts';
import { clearLostWrites, getLostWriteCount } from '../src/offline/failedWrites.ts';
import { clearSession, saveSession } from '../src/auth/tokenStorage.ts';
import { fakeApi, fakeCognito } from './fakeApi.ts';
import { storage } from './stubs/async-storage.ts';
import { store as keychain } from './stubs/expo-secure-store.ts';

/// The app, minus the screens: the QueryClient the app builds, the axios instance with
/// its interceptors, the persister, and the session in the Keychain. Tests drive it the
/// way the app does and look at what reaches the fake API.

export { fakeApi, fakeCognito, getLostWriteCount, storage };

export const tokenOf = (userId: string) => `token-${userId}`;

/// A session as AuthContext stores it after sign-in. `expiresInMs` below the refresh
/// margin (60 s) makes the next request try to refresh first.
export const signInAs = async (userId: string, { expiresInMs = 3_600_000 } = {}) => {
  fakeCognito.userId = userId;
  await saveSession({
    userId,
    name: userId,
    email: `${userId}@test`,
    tokens: { accessToken: tokenOf(userId), idToken: 'unused', refreshToken: `refresh-${userId}` },
    expiresAt: Date.now() + expiresInMs,
  });
};

export const signOutLocally = () => clearSession();

/// Through connectivity.ts, so onlineManager and the circuit breaker move exactly as they
/// do when the phone loses and regains its link.
export const connectionDrops = () => forceOffline(true);
export const connectionReturns = () => forceOffline(false);

const liveClients = new Set<QueryClient>();

/// A client as QueryLayer builds one, mounted as QueryClientProvider mounts it.
export const startApp = () => {
  const client = createQueryClient();
  client.mount();
  liveClients.add(client);
  return client;
};

/// Unmounted the way React unmounts a provider: what happens on sign-out, session expiry
/// and when the app is killed.
export const stopApp = (client: QueryClient) => {
  client.unmount();
  liveClients.delete(client);
};

/// Issues a write the way a screen does - by key, with everything else coming from the
/// registered defaults - without waiting for it to settle.
export const write = <TVariables>(
  client: QueryClient,
  factory: () => UseMutationOptions<any, unknown, TVariables, unknown>,
  variables: TVariables,
): Mutation<unknown, unknown, unknown, unknown> => {
  const { mutationKey } = factory();
  const mutation = client.getMutationCache().build(client, { mutationKey } as never);
  void mutation.execute(variables as never).catch(() => undefined);
  return mutation as Mutation<unknown, unknown, unknown, unknown>;
};

/// Writes the user's cache and queue to disk, as QueryLayer does on its throttle and
/// sign-out does on demand.
export const saveToDisk = (client: QueryClient, userId: string) => {
  const options = persistOptionsFor(userId);
  return persistQueryClientSave({
    queryClient: client,
    persister: options.persister,
    buster: options.buster,
    dehydrateOptions: options.dehydrateOptions,
  });
};

/// The next launch: a fresh client, restored from disk the way PersistQueryClientProvider
/// restores it, then resumed the way its onSuccess resumes it.
export const relaunch = async (userId: string) => {
  const client = startApp();
  await persistQueryClientRestore({ queryClient: client, ...persistOptionsFor(userId) });
  void client.resumePausedMutations();
  return client;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/// Polls until the condition holds. Fails with the message, rather than hanging, when it
/// never does.
export const waitFor = async (condition: () => boolean, message: string, timeoutMs = 5_000) => {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`Timed out: ${message}`);
    await sleep(20);
  }
};

export const requestsTo = (method: string, pathPrefix: string) =>
  fakeApi.requests.filter((r) => r.method === method && r.path.startsWith(pathPrefix));

/// A clean device between tests: nothing on disk, nobody signed in, link up, no lost
/// writes on record, and every client from the previous test gone.
export const resetDevice = async () => {
  for (const client of liveClients) stopApp(client);
  connectionDrops();
  fakeApi.reset();
  fakeCognito.reset();
  storage.clear();
  keychain.clear();
  await signOutLocally();
  clearLostWrites();
  connectionReturns();
};

/// Leaves nothing that would keep the test process alive: clients still retrying sleep on
/// timers, and held requests sit on open sockets.
export const shutDown = () => {
  for (const client of liveClients) stopApp(client);
  connectionDrops();
  fakeApi.dropConnections();
};

export const newId = () => crypto.randomUUID();
