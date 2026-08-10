import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../auth/AuthContext';

type Args = { email: string; password: string };

export const useSignIn = () => {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: ({ email, password }: Args) => signIn(email, password),
  });
};
