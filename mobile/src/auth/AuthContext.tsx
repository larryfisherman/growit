// Placeholder auth state — flipping isAuthed swaps RootNavigator between AuthStack and MainTabs.
// When real auth lands, replace internals with token storage (SecureStore) + user info.

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
