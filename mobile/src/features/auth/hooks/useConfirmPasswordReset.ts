import { useMutation } from '@tanstack/react-query';
import { authMutationOptions } from '../../../auth/authMutationOptions';
import { confirmPasswordReset } from '../../../auth/cognito';

type Args = { email: string; code: string; newPassword: string };

export const useConfirmPasswordReset = () =>
  useMutation({
    mutationFn: ({ email, code, newPassword }: Args) => confirmPasswordReset(email, code, newPassword),
    ...authMutationOptions,
  });
