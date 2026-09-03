/// Defaults applied to a freshly added plan-day exercise. The picker adds every
/// exercise with these; the user tweaks sets/reps/rest later on the day view.
export const DEFAULT_TARGETS = { sets: 3, reps: 10, restSeconds: 90 } as const;

/// True when an exercise still carries the untouched defaults - used to decide
/// whether deselecting it in the picker needs a confirmation.
export const isDefaultTargets = (t: {
  targetSets: number;
  targetReps: number;
  restSeconds: number;
}) =>
  t.targetSets === DEFAULT_TARGETS.sets &&
  t.targetReps === DEFAULT_TARGETS.reps &&
  t.restSeconds === DEFAULT_TARGETS.restSeconds;

/// Rows that exist only in the optimistic cache - the server has not answered with a
/// real id yet, so they must not be edited or deleted by id.
export const TEMP_ID_PREFIX = 'temp:';
export const isPendingExerciseId = (id: string) => id.startsWith(TEMP_ID_PREFIX);
