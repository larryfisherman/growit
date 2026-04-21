import { useQuery } from '@tanstack/react-query';
import { getTemplates } from '../../../api/templates';

const USER_ID = '00000000-0000-0000-0000-000000000001';

export const useTemplates = () =>
  useQuery({
    queryKey: ['templates', USER_ID],
    queryFn: () => getTemplates(USER_ID),
  });
