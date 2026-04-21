import { apiFetch } from './client';
import { TemplateDetail, TemplateSummary } from './types';

export const getTemplates = (userId: string) =>
  apiFetch<TemplateSummary[]>(`/api/templates?userId=${userId}`);

export const getTemplateById = (templateId: string) =>
  apiFetch<TemplateDetail>(`/api/templates/${templateId}`);

export const createTemplate = (data: { userId: string; name: string; notes: string | null }) =>
  apiFetch<{ id: string }>('/api/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTemplate = (templateId: string, data: { name: string; notes: string | null }) =>
  apiFetch(`/api/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteTemplate = (templateId: string) =>
  apiFetch(`/api/templates/${templateId}`, { method: 'DELETE' });

export const addExerciseToTemplate = (
  templateId: string,
  data: {
    exerciseId: string | null;
    customExerciseName: string | null;
    targetSets: number;
    targetReps: number;
    restSeconds: number;
  }
) =>
  apiFetch<{ id: string }>(`/api/templates/${templateId}/exercises`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTemplateExercise = (
  templateExerciseId: string,
  data: { targetSets: number; targetReps: number; restSeconds: number; orderIndex: number }
) =>
  apiFetch(`/api/templates/exercises/${templateExerciseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const removeExerciseFromTemplate = (templateExerciseId: string) =>
  apiFetch(`/api/templates/exercises/${templateExerciseId}`, { method: 'DELETE' });
