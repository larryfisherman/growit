import { useMutation } from '@tanstack/react-query';
import { authMutationOptions } from '../../../auth/authMutationOptions';
import { requestPasswordReset } from '../../../auth/cognito';

export const useRequestPasswordReset = () =>
  useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    ...authMutationOptions,
  });
