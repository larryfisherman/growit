/// What the two set fields hold, read as a set - or null while they do not make one yet.
/// Shared by logging a set and correcting one, so both accept exactly the same input.
export const parseSetInput = (weight: string, reps: string) => {
  if (weight.trim() === '') return null;

  // Polish keyboards offer a comma as the decimal separator.
  const weightKg = Number(weight.replace(',', '.'));
  const parsedReps = parseInt(reps, 10);

  if (!Number.isFinite(weightKg) || weightKg < 0 || !(parsedReps > 0)) return null;
  return { weightKg, reps: parsedReps };
};
