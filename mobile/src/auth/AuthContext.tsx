// Session state only — sign-up / confirm flows live in features/auth/hooks (react-query).
// Real token handling (SecureStore) lands together with sign-in.

import { createContext, useContext, useState, ReactNode } from 'react';

type AuthState = {
  isAuthed: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthed, setIsAuthed] = useState(false);

  return (
    <AuthContext.Provider
      value={{
        isAuthed,
        signIn: () => setIsAuthed(true),
        signOut: () => setIsAuthed(false),
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
