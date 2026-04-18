import { apiFetch } from './client';
import { Exercise } from './types';

export const getExercises = () => apiFetch<Exercise[]>('/api/exercises');
