import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { Exercise } from '../api/types';

export const useExercises = () =>
  useQuery({
    queryKey: ['exercises'],
    queryFn: () => apiFetch<Exercise[]>('/api/exercises'),
  });
