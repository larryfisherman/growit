import type {
  PlanDayExerciseResponse,
  PlanDayExerciseSelection,
  PlanDayResponse,
} from '../../api/generated/schemas';
import { DEFAULT_TARGETS, isDefaultTargets } from './constants';

/// Pure pick-resolution rules behind PlanDayExercisePickerScreen, kept free of React so
/// they can be tested under node.

/// A pick the user has just made carries the id its row will get, minted here rather than
/// waited for. That is what lets the row be edited, reordered and referred to straight
/// away, with or without a connection.
export type ExercisePick =
  | { kind: 'existing'; row: PlanDayExerciseResponse }
  | { kind: 'library'; rowId: string; exerciseId: string; name: string; category: string | null }
  | { kind: 'custom'; rowId: string; name: string };

/// The day as it looked when the picker opened, keyed by library exercise id. It separates
/// a pick made just now from one that has been around, and carries the performed flag and
/// the original targets that the removal-confirm rule reads.
export type PickerSnapshot = {
  initialByExerciseId: Map<string, PlanDayExerciseResponse>;
  performed: boolean;
};

export const pickExerciseId = (pick: ExercisePick) =>
  pick.kind === 'existing' ? pick.row.exerciseId : pick.kind === 'library' ? pick.exerciseId : null;

/// Built from the resolved rows rather than from the raw picks, and that difference
/// matters: a pick that turns out to match a row the day already has must be sent as that
/// row, not as a new one carrying a fresh id. Sending the fresh id would have the server
/// drop the existing row and rebuild it on default targets, quietly undoing whatever the
/// user had tuned.
export const toSelection = (row: PlanDayExerciseResponse): PlanDayExerciseSelection => ({
  planDayExerciseId: row.id,
  exerciseId: row.exerciseId,
  customExerciseName: row.exerciseId ? null : row.exerciseName,
});

/// Renders the picks as day exercises for the optimistic cache. Each pick is resolved
/// against what the day already holds, so once a write lands and the day refetches, the
/// placeholder rows quietly turn into the real ones - ids, tuned targets and all.
export const toDayExercises = (
  picks: ExercisePick[],
  day: PlanDayResponse,
): PlanDayExerciseResponse[] =>
  picks.map((pick, orderIndex) => {
    const live =
      pick.kind === 'existing'
        ? day.exercises.find((e) => e.id === pick.row.id)
        : pick.kind === 'library'
          ? day.exercises.find((e) => e.exerciseId === pick.exerciseId)
          : day.exercises.find((e) => e.exerciseId === null && e.exerciseName === pick.name);

    if (live) return { ...live, orderIndex };
    if (pick.kind === 'existing') return { ...pick.row, orderIndex };

    const isLibrary = pick.kind === 'library';
    return {
      id: pick.rowId,
      exerciseId: isLibrary ? pick.exerciseId : null,
      exerciseName: pick.name,
      category: isLibrary ? pick.category : null,
      targetSets: DEFAULT_TARGETS.sets,
      targetReps: DEFAULT_TARGETS.reps,
      restSeconds: DEFAULT_TARGETS.restSeconds,
      orderIndex,
      lastPerformance: null,
    };
  });

/// Whether deselecting a library exercise should ask first. Picks made in this session,
/// and ones the user already OK'd removing, go silently; so does a row that still has the
/// default targets on a day never performed. Anything else would lose real work.
export const needsRemovalConfirm = (
  snapshot: PickerSnapshot,
  confirmedIds: ReadonlySet<string>,
  exerciseId: string,
): boolean => {
  if (!snapshot.initialByExerciseId.has(exerciseId)) return false;
  if (confirmedIds.has(exerciseId)) return false;

  const existing = snapshot.initialByExerciseId.get(exerciseId);
  return snapshot.performed || (existing ? !isDefaultTargets(existing) : false);
};
