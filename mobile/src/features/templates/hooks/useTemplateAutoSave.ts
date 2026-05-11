import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePutApiTemplatesTemplateId,
  getGetApiTemplatesTemplateIdQueryKey,
} from '../../../api/generated/templates/templates';
import { TemplateResponse } from '../../../api/generated/schemas';

type Args = {
  templateId: string | null;
  template: TemplateResponse | undefined;
  name: string;
  notes: string;
  delayMs?: number;
};

export const useTemplateAutoSave = ({ templateId, template, name, notes, delayMs = 600 }: Args) => {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryKey = templateId ? getGetApiTemplatesTemplateIdQueryKey(templateId) : null;

  const { mutate: update } = usePutApiTemplatesTemplateId({
    mutation: {
      onMutate: async ({ data }) => {
        if (!queryKey) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<TemplateResponse>(queryKey);
        queryClient.setQueryData<TemplateResponse>(queryKey, (old) =>
          old ? { ...old, name: data.name, notes: data.notes ?? null } : old
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (queryKey && context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
      },
      onSettled: () => {
        if (queryKey) queryClient.invalidateQueries({ queryKey });
      },
    },
  });

  useEffect(() => {
    if (!templateId || !template) return;
    if (!name.trim()) return;

    const trimmedNotes = notes.trim() || null;
    const unchanged = name.trim() === template.name && trimmedNotes === (template.notes ?? null);
    if (unchanged) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      update({ templateId, data: { name: name.trim(), notes: trimmedNotes } });
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [name, notes, template, templateId, delayMs, update]);
};
