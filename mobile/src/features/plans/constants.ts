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


/// Longest hand-typed exercise name the backend accepts (FieldLimits.NameMaxLength). The
/// day and every session started from it share the limit, so a name the picker lets
/// through can always be copied into a workout.
export const CUSTOM_EXERCISE_NAME_MAX_LENGTH = 100;
