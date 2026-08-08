import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'growit.accessToken';
const ID_TOKEN_KEY = 'growit.idToken';
const REFRESH_TOKEN_KEY = 'growit.refreshToken';
const EMAIL_KEY = 'growit.email';

export type StoredTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

export const saveTokens = async (tokens: StoredTokens, email: string): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(EMAIL_KEY, email),
  ]);
};

export const getAccessToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const getIdToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(ID_TOKEN_KEY);

export const getStoredEmail = (): Promise<string | null> =>
  SecureStore.getItemAsync(EMAIL_KEY);

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(ID_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EMAIL_KEY),
  ]);
};
