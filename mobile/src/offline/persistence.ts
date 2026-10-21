import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mutation, Query } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

/// Bump when the shape of the cached reads changes. Only the reads are discarded on a
/// mismatch - the write queue is kept, because it holds things the user did that the
/// server has not seen yet, and an app update is no reason to lose them.
export const CACHE_VERSION = 'v1';

/// Everything the app reads from the API, and nothing else. The exercise library is in
/// here on purpose: without it a session opened offline after a restart would show rows
/// with no names.
const PERSISTED_PREFIXES = ['/api/training-plans', '/api/Workouts', '/api/Exercises'];

/// Every write the server has not confirmed - not only the ones paused for want of a
/// network (TanStack's default). A write on the wire or waiting out a retry back-off when
/// the app is killed is just as unsent, and it was the one most likely to be lost: its
/// optimistic patch was persisted, the write itself was not.
const isUnsent = (mutation: Mutation) => mutation.state.status === 'pending';

/// What goes to disk for each queued write.
///
/// Stored as paused, so the next launch resumes it - resumePausedMutations only looks at
/// paused writes, and one restored as "running" would sit there forever. Replaying it is
/// safe: ids come from the client and the server treats a repeat as a no-op.
///
/// The last failure is left out. It is an axios error carrying the request config,
/// Authorization header included, and AsyncStorage is not the Keychain.
const forDisk = (client: PersistedClient): PersistedClient => ({
  ...client,
  clientState: {
    ...client.clientState,
    mutations: client.clientState.mutations.map((mutation) => ({
      ...mutation,
      state: { ...mutation.state, isPaused: true, failureReason: null, error: null },
    })),
  },
});

/// Reads written by an older version are dropped; its queue is carried over.
const keepQueueAcrossVersions = (persister: Persister): Persister => ({
  ...persister,
  restoreClient: async () => {
    const restored = await persister.restoreClient();
    if (!restored || restored.buster === CACHE_VERSION) return restored;

    return {
      ...restored,
      buster: CACHE_VERSION,
      clientState: { queries: [], mutations: restored.clientState.mutations },
    };
  },
});

/// Where one user's cache and write queue live on the device.
///
/// Kept apart from QueryLayer so the tests restore and save through exactly the options
/// the app uses, rather than a copy of them.
export const persistOptionsFor = (userId: string) => ({
  // Keyed by user. Query keys for plans carry no user id - the server takes it from the
  // token - so one shared store would hand the next account the previous one's plans.
  persister: keepQueueAcrossVersions(
    createAsyncStoragePersister({
      storage: AsyncStorage,
      key: `growit.rq.${userId}`,
      throttleTime: 1000,
      serialize: (client) => JSON.stringify(forDisk(client)),
    }),
  ),
  // Not the default 24 hours. That clock governs the write queue as much as the cache,
  // and a day offline is a long weekend, not a reason to throw away someone's training.
  maxAge: Infinity,
  buster: CACHE_VERSION,
  dehydrateOptions: {
    shouldDehydrateMutation: isUnsent,
    shouldDehydrateQuery: (query: Query) => {
      if (query.state.status !== 'success') return false;
      const [first] = query.queryKey;
      return typeof first === 'string' && PERSISTED_PREFIXES.some((p) => first.startsWith(p));
    },
  },
});
