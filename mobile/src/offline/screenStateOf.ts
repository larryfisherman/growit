import type { ScreenStateKind } from '../theme/components/ScreenState';

/// What a query is doing, in the two fields that actually distinguish the cases.
type QueryLike = {
  status: 'pending' | 'error' | 'success';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  data: unknown;
};

/// Works out which ScreenState a screen should show for a query, or null when it should
/// render its data.
///
/// The case worth spelling out is 'offline'. A query that has never resolved and cannot
/// run has status 'pending' with fetchStatus 'paused' - which means isLoading is false,
/// because isLoading is pending AND fetching. Screens keyed off isLoading therefore fall
/// straight through to their empty state and tell the user they have no plans, when the
/// truth is that nobody has been able to ask yet.
///
/// Data on hand always wins. A failed background refetch leaves status 'error' but keeps
/// the data - cached from an earlier visit, or seeded for something created offline whose
/// write is still queued - and swapping that for an error screen with no way back would
/// strand the user on a flaky link.
export const screenStateOf = (query: QueryLike): ScreenStateKind | null => {
  if (query.data !== undefined) return null;
  if (query.status === 'error') return 'error';
  if (query.status !== 'pending') return null;

  return query.fetchStatus === 'paused' ? 'offline' : 'loading';
};
