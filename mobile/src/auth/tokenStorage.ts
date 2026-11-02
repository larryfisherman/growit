import * as SecureStore from 'expo-secure-store';
import type { Session } from './cognito';

/// Every Keychain entry that makes up a signed-in session.
const SESSION_KEYS = {
  accessToken: 'growit.accessToken',
  idToken: 'growit.idToken',
  refreshToken: 'growit.refreshToken',
  name: 'growit.name',
  email: 'growit.email',
  userId: 'growit.userId',
  expiresAt: 'growit.expiresAt',
} as const;

export type StoredAccessToken = { token: string; expiresAt: number };

/// Every outgoing request reads the access token, and each read is a Keychain round
/// trip - noticeable when a queue of writes drains at once. Only the two functions
/// that can change the stored token touch this.
let cachedAccessToken: StoredAccessToken | null = null;

/// Sessions written before expiry was tracked have nothing here. Zero reads as
/// "expired", which refreshes on the next request instead of signing the user out.
const toExpiry = (stored: string | null): number => Number(stored ?? 0) || 0;

export const saveSession = async (session: Session): Promise<void> => {
  // Anything already cached describes the session being replaced, so it has to go before
  // the write rather than after: a failed write must not leave a token in memory that is
  // not on disk, and the next read should go and find out what is really stored.
  cachedAccessToken = null;

  await Promise.all([
    SecureStore.setItemAsync(SESSION_KEYS.accessToken, session.tokens.accessToken),
    SecureStore.setItemAsync(SESSION_KEYS.idToken, session.tokens.idToken),
    SecureStore.setItemAsync(SESSION_KEYS.refreshToken, session.tokens.refreshToken),
    SecureStore.setItemAsync(SESSION_KEYS.name, session.name),
    SecureStore.setItemAsync(SESSION_KEYS.email, session.email),
    SecureStore.setItemAsync(SESSION_KEYS.userId, session.userId),
    SecureStore.setItemAsync(SESSION_KEYS.expiresAt, String(session.expiresAt)),
  ]);

  cachedAccessToken = { token: session.tokens.accessToken, expiresAt: session.expiresAt };
};

export const loadSession = async (): Promise<Session | null> => {
  const [accessToken, idToken, refreshToken, name, email, userId, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(SESSION_KEYS.accessToken),
    SecureStore.getItemAsync(SESSION_KEYS.idToken),
    SecureStore.getItemAsync(SESSION_KEYS.refreshToken),
    SecureStore.getItemAsync(SESSION_KEYS.name),
    SecureStore.getItemAsync(SESSION_KEYS.email),
    SecureStore.getItemAsync(SESSION_KEYS.userId),
    SecureStore.getItemAsync(SESSION_KEYS.expiresAt),
  ]);

  if (!accessToken || !idToken || !refreshToken || !email || !userId) return null;

  const expiry = toExpiry(expiresAt);
  cachedAccessToken = { token: accessToken, expiresAt: expiry };

  return {
    userId,
    name: name ?? '',
    email,
    tokens: { accessToken, idToken, refreshToken },
    expiresAt: expiry,
  };
};

export const getAccessToken = async (): Promise<StoredAccessToken | null> => {
  if (cachedAccessToken) return cachedAccessToken;

  const [token, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(SESSION_KEYS.accessToken),
    SecureStore.getItemAsync(SESSION_KEYS.expiresAt),
  ]);
  if (!token) return null;

  cachedAccessToken = { token, expiresAt: toExpiry(expiresAt) };
  return cachedAccessToken;
};

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(SESSION_KEYS.refreshToken);

export const getStoredEmail = (): Promise<string | null> =>
  SecureStore.getItemAsync(SESSION_KEYS.email);

export const clearSession = async (): Promise<void> => {
  cachedAccessToken = null;

  // Iterates the record rather than listing keys again, so a key added later can never
  // survive sign-out and leave the previous user's data on the device.
  await Promise.all(Object.values(SESSION_KEYS).map((key) => SecureStore.deleteItemAsync(key)));
};
