import { useMutation } from '@tanstack/react-query';
import { signUp } from '../../../auth/cognito';

type Args = { email: string; password: string };

export const useSignUp = () =>
  useMutation({
    mutationFn: ({ email, password }: Args) => signUp(email, password),
  });
