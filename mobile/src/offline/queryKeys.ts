/// The one home for every query-key prefix the offline layer matches on.
///
/// Orval names query keys after the URL, so a prefix identifies a family of queries: the
/// invalidation in optimistic.ts, the persisted set in persistence.ts and the cache
/// patches in cachePatches.ts all find their queries this way. Nothing in the generated
/// client ties these strings to the routes, so a route casing change in a controller
/// must be fixed here, and nowhere else.
///
/// The trailing slashes are deliberate: `plans` and `workouts` match a whole family, list
/// endpoints included; `planDay` matches only `/days/{id}` keys, and `workoutEntry` only
/// keys below `/api/Workouts/` (one workout, by-date, by-month, history).
export const KEY_PREFIX = {
  plans: '/api/training-plans',
  workouts: '/api/Workouts',
  exercises: '/api/Exercises',
  planDay: '/api/training-plans/days/',
  workoutEntry: '/api/Workouts/',
} as const;

/// Sits inside the key of the "workout on a given date" query.
export const BY_DATE_MARKER = '/by-date';

/// The URL part of a query key, or undefined for a key orval did not make.
export const keyHead = (queryKey: readonly unknown[]) =>
  typeof queryKey[0] === 'string' ? queryKey[0] : undefined;

/// Whether the key's URL part starts with the given prefix.
export const keyStartsWith = (queryKey: readonly unknown[], prefix: string) =>
  keyHead(queryKey)?.startsWith(prefix) === true;
