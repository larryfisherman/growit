// Owns the session: who is signed in, and the tokens backing it.
// Stateless Cognito calls (sign-up, confirmation) live in features/auth/hooks instead.

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signIn as cognitoSignIn, revokeRefreshToken, Session } from './cognito';
import { saveSession, loadSession, clearSession } from './tokenStorage';
import { setSessionExpiredHandler } from './sessionExpiry';

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

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setSession(null);
      queryClient.clear();
      void clearSession();
    });

    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    const next = await cognitoSignIn(email, password);
    await saveSession(next);
    setSession(next);
  };

  const signOut = async () => {
    const current = session;
    // Drop the session first: the user asked to leave, and a failure further down
    // must not leave them stuck inside. Clearing the cache stops the next account
    // from seeing the previous one's workouts.
    setSession(null);
    queryClient.clear();

    try {
      await clearSession();
      // Best effort: invalidating the token server-side is worth doing, but the
      // user is already out either way, so a network failure changes nothing.
      if (current) await revokeRefreshToken(current.tokens.refreshToken);
    } catch (err) {
      console.error('Sign-out cleanup failed', err);
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
