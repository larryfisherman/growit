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
  exerciseId: string;
  exerciseName: string;
  category: string;
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

export type TodayWorkout = {
  id: string;
  name: string;
  performedAt: string;
  exerciseCount: number;
} | null;
