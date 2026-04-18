import { apiFetch } from './client';
import { TodayWorkout, WorkoutDetail } from './types';

export const getWorkoutByDate = (userId: string, date: string) =>
  apiFetch<TodayWorkout>(`/api/workouts/${userId}/by-date?date=${date}`);

export const getWorkoutById = (workoutId: string) =>
  apiFetch<WorkoutDetail>(`/api/workouts/${workoutId}`);

export const createWorkout = (data: {
  userId: string;
  name: string;
  performedAt: string;
  notes: string | null;
}) =>
  apiFetch<{ id: string }>('/api/workouts', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const addExerciseToWorkout = (workoutId: string, exerciseId: string) =>
  apiFetch(`/api/workouts/${workoutId}/exercises`, {
    method: 'POST',
    body: JSON.stringify({ exerciseId }),
  });
