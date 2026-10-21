import type { Mutation, MutationCache, MutationKey } from '@tanstack/react-query';

const keyOf = (mutationKey: MutationKey | undefined) => JSON.stringify(mutationKey ?? []);

/// Two writes aim at the same thing when they name the same target - which is every
/// variable except the payload itself.
const targetOf = (variables: unknown) => {
  if (!variables || typeof variables !== 'object') return JSON.stringify(variables ?? null);
  const { data: _payload, ...target } = variables as Record<string, unknown>;
  return JSON.stringify(target);
};

/// Throws away queued writes that the one just issued has made pointless.
///
/// Only ever applied to requests carrying the whole desired state of their target rather
/// than a delta. For those, sending the latest is equivalent to replaying every earlier
/// one in order - so renaming a plan ten times on a train should leave one request in the
/// queue, not ten.
///
/// Creates and logged sets are deliberately left out: each one is a fact of its own, and
/// dropping the earlier ones would lose what the user did.
///
/// Only the run of copies sitting directly in front of the new write is dropped. The new
/// write goes out from the back of the queue, so dropping an older copy moves its effect
/// to the back too - harmless when nothing stands in between, wrong when something does.
/// A day's exercise list creates rows; an edit to one of those rows queued after it must
/// still reach the server after the list, not before it. So the first unrelated write met
/// walking backwards ends the run, and everything older stays where it is.
///
/// Hooked to the cache rather than to individual mutations because it needs to know which
/// write is the new one. By the time onMutate runs, that write is already sitting in the
/// cache marked paused, indistinguishable from the ones it supersedes - and only the
/// cache-level callback is handed the mutation itself.
export const dropSupersededWrites = (
  cache: MutationCache,
  issued: Mutation<unknown, unknown, unknown, unknown>,
  supersedable: ReadonlySet<string>,
) => {
  const key = keyOf(issued.options.mutationKey);
  if (!supersedable.has(key)) return;

  const target = targetOf(issued.state.variables);
  const scope = issued.options.scope?.id;

  // Writes still waiting their turn in the same queue as this one. Settled writes stay
  // in the cache for a while but are no longer in the queue, so they separate nothing.
  const all = cache.getAll();
  const inQueue = (mutation: (typeof all)[number]) =>
    mutation.options.scope?.id === scope &&
    mutation.state.status !== 'success' &&
    mutation.state.status !== 'error';

  const position = all.findIndex((mutation) => mutation === issued);

  for (let index = position - 1; index >= 0; index--) {
    const queued = all[index];
    if (!inQueue(queued)) continue;

    const sameTarget =
      keyOf(queued.options.mutationKey) === key && targetOf(queued.state.variables) === target;

    // Anything already in flight is past the point of being called off - and, like a
    // different write, it has to stay ahead of the new one.
    if (!sameTarget || !queued.state.isPaused) return;

    cache.remove(queued);
  }
};
