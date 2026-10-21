import { MutationCache, QueryClient } from '@tanstack/react-query';
import { dropSupersededWrites } from './coalesce';
import { recordLostWrite } from './failedWrites';
import { isRetiredClientError } from './retiredClient';
import { shouldRetryWrite } from './retryPolicy';
import { registerMutationDefaults } from './mutationDefaults';
import { WRITE_SCOPE } from './writeScope';

/// A client that knows when it has been torn down.
///
/// QueryClientProvider mounts the client and unmounts it when it leaves the tree - which
/// for a per-user client means its user signed out or their session expired. TanStack
/// stops listening for the network at that point, but anything already moving in the
/// write queue keeps going: each write that finishes starts the next. Being retired is
/// what lets the registered mutationFns refuse to send. Counted rather than flipped, so
/// StrictMode's mount-unmount-mount in development leaves the client usable.
class AppQueryClient extends QueryClient {
  #mounts = 0;
  #retired = false;

  get isRetired() {
    return this.#retired;
  }

  mount(): void {
    this.#mounts += 1;
    this.#retired = false;
    super.mount();
  }

  unmount(): void {
    this.#mounts -= 1;
    if (this.#mounts <= 0) this.#retired = true;
    super.unmount();
  }
}

export const createQueryClient = () => {
  const supersedable = new Set<string>();

  // Cache-level rather than per-mutation: only this callback is handed the mutation that
  // was just issued, and without that reference a write cannot tell itself apart from the
  // ones it supersedes.
  const mutationCache = new MutationCache({
    onMutate: (_variables, mutation) => {
      dropSupersededWrites(mutationCache, mutation, supersedable);
    },
    // Reached only once a write has stopped being retried, so this is where a write is
    // finally lost. The optimistic patch it applied is still in the cache and offline
    // nothing will refetch it away, so someone has to say so out loud.
    //
    // Only for writes in the queue, though. Sign-in and sign-up run on this client too,
    // and a wrong password is the screen's to explain, not a lost change. Neither is a
    // write a retired client declined to send: it is safe on disk.
    onError: (error, _variables, _context, mutation) => {
      if (mutation.options.scope?.id !== WRITE_SCOPE.id) return;
      if (isRetiredClientError(error)) return;
      recordLostWrite();
    },
  });

  const queryClient = new AppQueryClient({
    mutationCache,
    defaultOptions: {
      queries: {
        // 'online', not 'offlineFirst': React Native has no HTTP cache underneath, so
        // offlineFirst would just turn every read into an error instead of leaving it
        // paused with whatever the cache already holds.
        networkMode: 'online',
        staleTime: 30_000,
        // Persistence needs the entry to still be in memory when it is written out.
        gcTime: Infinity,
        retry: 2,
      },
      mutations: {
        networkMode: 'online',
        // The default is 0, and with it a write that failed once would be dropped on
        // the floor rather than queued.
        retry: shouldRetryWrite,
        scope: WRITE_SCOPE,
      },
    },
  });

  // Registered here rather than by the caller because the two cannot be separated: once
  // the queue is persisted, hydration rebuilds mutations through defaultMutationOptions,
  // and a key with no registered mutationFn comes back unable to run.
  registerMutationDefaults(queryClient, supersedable, () => queryClient.isRetired);

  return queryClient;
};
