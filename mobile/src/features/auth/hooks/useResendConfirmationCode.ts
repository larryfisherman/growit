import { useMutation } from '@tanstack/react-query';
import { resendConfirmationCode } from '../../../auth/cognito';

export const useResendConfirmationCode = () =>
  useMutation({
    mutationFn: (email: string) => resendConfirmationCode(email),
  });
