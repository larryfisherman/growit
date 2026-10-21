import type { Query, QueryClient } from '@tanstack/react-query';
import { WRITE_SCOPE } from './writeScope';

/// Orval names query keys after the URL, so everything a write can disturb already
/// shares a prefix. Invalidating a whole family is blunter than listing exact keys, but
/// it is always right - and the alternative is a per-mutation list that silently rots
/// the first time a screen starts reading something the list does not mention. With a
/// handful of queries the extra refetch costs nothing.
const FAMILY_PREFIX = {
  plans: '/api/training-plans',
  workouts: '/api/Workouts',
} as const;

export type QueryFamily = keyof typeof FAMILY_PREFIX;

const touching = (families: readonly QueryFamily[]) => (query: Query) => {
  const [first] = query.queryKey;
  return typeof first === 'string' && families.some((f) => first.startsWith(FAMILY_PREFIX[f]));
};

/// The shape every write in the app shares.
///
/// Two departures from the hooks this replaces, both forced by what happens after the
/// app is killed with writes still queued:
///
///   - No snapshot, no rollback branch. The old handlers stashed the previous cache
///     value in the mutation context, but context is written out to storage with the
///     queue, and a mutation resumed from storage never runs onMutate - so the snapshot
///     would not be there to roll back to anyway. onSettled refetches instead, which
///     undoes a failed write and costs one request.
///   - Nothing closes over component state. A resumed mutation has no component behind
///     it; everything has to come from the variables or the cache.
/// Families whose refetch is owed once the queue empties, per client.
const owedRefetches = new WeakMap<QueryClient, Set<QueryFamily>>();

/// Writes still waiting in the queue, the one settling right now included - its status
/// only flips after its callbacks have run.
const queuedWrites = (queryClient: QueryClient) =>
  queryClient.isMutating({
    predicate: (mutation) =>
      mutation.options.scope?.id === WRITE_SCOPE.id && mutation.state.status === 'pending',
  });

export const optimistic = <TVariables>(
  queryClient: QueryClient,
  families: readonly QueryFamily[],
  apply?: (variables: TVariables, queryClient: QueryClient) => void,
) => {
  const predicate = touching(families);

  return {
    onMutate: async (variables: TVariables) => {
      // Stop any refetch already in the air: letting it land after the patch would
      // overwrite the optimistic row with the state the server held a moment ago.
      //
      // Only refetches, though - never a first load. cancelQueries reverts by default,
      // and reverting a query that has no data yet leaves it pending with fetchStatus
      // idle and nothing to restart it, so the screen waiting on it silently falls into
      // its empty state until something remounts. A query with no data also has nothing
      // for a late response to overwrite, so there is no reason to touch it.
      await queryClient.cancelQueries({
        predicate: (query) => predicate(query) && query.state.data !== undefined,
      });

      apply?.(variables, queryClient);
    },
    // Fires on success and on final failure, but never while a write sits queued
    // offline - so the optimistic view survives exactly as long as it should.
    //
    // Not while other writes are still queued behind this one, though. The refetch
    // would bring back what the server holds so far, which does not yet include them,
    // and their optimistic rows would vanish from the screen until they land - a day
    // disappearing and reappearing while a queue drains after a flight. The refetch is
    // owed instead, and paid by whichever write empties the queue.
    onSettled: () => {
      const owed = owedRefetches.get(queryClient) ?? new Set<QueryFamily>();
      families.forEach((family) => owed.add(family));

      if (queuedWrites(queryClient) > 1) {
        owedRefetches.set(queryClient, owed);
        return;
      }

      owedRefetches.delete(queryClient);
      const due = touching([...owed]);
      void queryClient.invalidateQueries({ predicate: due });
    },
  };
};
