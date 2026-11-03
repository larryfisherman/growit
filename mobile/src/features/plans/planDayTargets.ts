/// The text drafts of a plan-day row's targets, read as targets - or null while they do
/// not make valid ones. The server refuses anything else, and a session started from a
/// day copies its targets, so a value let through here would cost that session too.
export const parsePlanDayTargets = (draft: { sets: string; reps: string; rest: string }) => {
  const targetSets = parseInt(draft.sets, 10);
  const targetReps = parseInt(draft.reps, 10);
  const restSeconds = parseInt(draft.rest, 10);

  if (!(targetSets > 0) || !(targetReps > 0) || !(restSeconds >= 0)) return null;
  return { targetSets, targetReps, restSeconds };
};
