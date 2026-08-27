import * as SecureStore from 'expo-secure-store';
import { Session } from './cognito';

const ACCESS_TOKEN_KEY = 'growit.accessToken';
const ID_TOKEN_KEY = 'growit.idToken';
const REFRESH_TOKEN_KEY = 'growit.refreshToken';
const NAME_KEY = 'growit.name';
const EMAIL_KEY = 'growit.email';
const USER_ID_KEY = 'growit.userId';

export const saveSession = async (session: Session): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.tokens.accessToken),
    SecureStore.setItemAsync(ID_TOKEN_KEY, session.tokens.idToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.tokens.refreshToken),
    SecureStore.setItemAsync(NAME_KEY, session.name),
    SecureStore.setItemAsync(EMAIL_KEY, session.email),
    SecureStore.setItemAsync(USER_ID_KEY, session.userId),
  ]);
};

export const loadSession = async (): Promise<Session | null> => {
  const [accessToken, idToken, refreshToken, name, email, userId] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(ID_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(NAME_KEY),
    SecureStore.getItemAsync(EMAIL_KEY),
    SecureStore.getItemAsync(USER_ID_KEY),
  ]);

  if (!accessToken || !idToken || !refreshToken || !email || !userId) return null;

  return { userId, name: name ?? '', email, tokens: { accessToken, idToken, refreshToken } };
};

export const getAccessToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const getStoredEmail = (): Promise<string | null> => SecureStore.getItemAsync(EMAIL_KEY);

export const clearSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(ID_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(NAME_KEY),
    SecureStore.deleteItemAsync(EMAIL_KEY),
    SecureStore.deleteItemAsync(USER_ID_KEY),
  ]);
};
