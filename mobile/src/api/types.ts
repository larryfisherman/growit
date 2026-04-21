export type Exercise = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
};

export type SetDetail = {
  id: string;
  weightKg: number;
  reps: number;
  orderIndex: number;
};

export type WorkoutExerciseDetail = {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  category: string | null;
  targetSets: number | null;
  targetReps: number | null;
  restSeconds: number | null;
  orderIndex: number;
  sets: SetDetail[];
};

export type WorkoutDetail = {
  id: string;
  name: string;
  performedAt: string;
  notes: string | null;
  exercises: WorkoutExerciseDetail[];
};

export type WorkoutSummary = {
  id: string;
  name: string;
  performedAt: string;
  exerciseCount: number;
};

export type TodayWorkout = WorkoutSummary | null;

export type TemplateSummary = {
  id: string;
  name: string;
  exerciseCount: number;
};

export type TemplateExerciseDetail = {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  category: string | null;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  orderIndex: number;
};

export type TemplateDetail = {
  id: string;
  name: string;
  notes: string | null;
  exercises: TemplateExerciseDetail[];
};
