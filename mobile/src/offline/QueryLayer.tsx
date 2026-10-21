import { ReactNode, useEffect, useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider, persistQueryClientSave } from '@tanstack/react-query-persist-client';
import { useAuth } from '../auth/AuthContext';
import { setQueueInspector } from './pendingWrites';
import { persistOptionsFor } from './persistence';
import { createQueryClient } from './queryClient';

/// Signed in: a client of this user's own, restored from disk and saved back to it.
///
/// The key on this component is what isolates accounts - a different user remounts the
/// whole thing rather than reusing a client that has been told to forget. queryClient.clear()
/// used to do that job and took the write queue with it every time.
const PersistedQueries = ({ userId, children }: { userId: string; children: ReactNode }) => {
  // Built during render, before anything can hydrate into it: hydration rebuilds mutations
  // through defaultMutationOptions, and a key whose mutationFn is not registered yet comes
  // back unable to run. createQueryClient registers them synchronously for that reason.
  const queryClient = useMemo(() => createQueryClient(), [userId]);
  const persistOptions = useMemo(() => persistOptionsFor(userId), [userId]);

  useEffect(() => {
    setQueueInspector({
      pausedCount: () =>
        queryClient.getMutationCache().getAll().filter((m) => m.state.isPaused).length,
      persist: () =>
        persistQueryClientSave({
          queryClient,
          persister: persistOptions.persister,
          buster: persistOptions.buster,
          dehydrateOptions: persistOptions.dehydrateOptions,
        }),
    });

    return () => setQueueInspector(null);
  }, [queryClient, persistOptions]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      // Deliberately not returning the promise. The provider chains whatever onSuccess
      // gives back into the same .finally that clears isRestoring, and resuming a queue
      // that cannot run yet settles only once it does - which would hold the app on a
      // loading screen for as long as the writes are waiting.
      onSuccess={() => {
        void queryClient.resumePausedMutations();
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

export const QueryLayer = ({ children }: { children: ReactNode }) => {
  const { isAuthed, userId } = useAuth();

  // Signed out there is nothing worth keeping: the auth screens read no API, and writing
  // a store for a user we do not have would only leave rubbish behind.
  const anonymousClient = useMemo(() => createQueryClient(), []);

  if (!isAuthed || !userId) {
    return <QueryClientProvider client={anonymousClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistedQueries key={userId} userId={userId}>
      {children}
    </PersistedQueries>
  );
};
