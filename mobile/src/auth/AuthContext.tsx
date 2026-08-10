// Owns the session: who is signed in, and the tokens backing it.
// Stateless Cognito calls (sign-up, confirmation) live in features/auth/hooks instead.

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signIn as cognitoSignIn, signOut as cognitoSignOut, Session } from './cognito';
import { saveSession, loadSession, clearSession } from './tokenStorage';

type AuthState = {
  isBootstrapping: boolean;
  isAuthed: boolean;
  userId: string | null;
  email: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .finally(() => setIsBootstrapping(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const next = await cognitoSignIn(email, password);
    await saveSession(next);
    setSession(next);
  };

  const signOut = async () => {
    const current = session;
    setSession(null);
    queryClient.clear();
    if (current) cognitoSignOut(current.email);

    try {
      await clearSession();
    } catch (err) {
      console.error('Failed to clear the stored session', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isBootstrapping,
        isAuthed: session !== null,
        userId: session?.userId ?? null,
        email: session?.email ?? null,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const useUserId = (): string => {
  const { userId } = useAuth();
  if (!userId) throw new Error('useUserId used outside an authenticated screen');
  return userId;
};
