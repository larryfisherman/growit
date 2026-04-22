import { useState } from 'react';

export type ExerciseSelection = { exerciseId: string | null; name: string };

export type ExerciseFormPayload = {
  exerciseId: string | null;
  customExerciseName: string | null;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

type TargetsInput = { sets: string; reps: string; rest: string };
type TargetsParsed = Pick<ExerciseFormPayload, 'targetSets' | 'targetReps' | 'restSeconds'>;

const parseTargets = (t: TargetsInput): TargetsParsed | null => {
  const targetSets = parseInt(t.sets, 10);
  const targetReps = parseInt(t.reps, 10);
  const restSeconds = parseInt(t.rest, 10);
  if (!targetSets || !targetReps || isNaN(restSeconds)) return null;
  return { targetSets, targetReps, restSeconds };
};

export const useTemplateExerciseForm = (onSubmit: (payload: ExerciseFormPayload) => void) => {
  const [selection, setSelection] = useState<ExerciseSelection | null>(null);
  const [targets, setTargets] = useState<TargetsInput>({ sets: '3', reps: '10', rest: '90' });

  const setTarget = (key: keyof TargetsInput, value: string) =>
    setTargets((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const parsed = parseTargets(targets);
    if (!selection || !parsed) return;

    onSubmit({
      exerciseId: selection.exerciseId,
      customExerciseName: selection.exerciseId ? null : selection.name.trim(),
      ...parsed,
    });
  };

  return { selection, setSelection, targets, setTarget, handleSubmit };
};
