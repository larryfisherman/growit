import { useQuery } from '@tanstack/react-query';
import { getTemplateById } from '../../../api/templates';

export const useTemplate = (templateId: string | null) =>
  useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplateById(templateId!),
    enabled: !!templateId,
  });
