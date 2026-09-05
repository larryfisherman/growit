import Constants from 'expo-constants';

const API_PORT = 5053;

// Production: EXPO_PUBLIC_API_URL from .env / .env.production.
// Dev on device: LAN IP from Expo dev server.
// Web / fallback: localhost.
const resolveBaseUrl = (): string => {
  const prodUrl = process.env.EXPO_PUBLIC_API_URL;
  if (prodUrl) return prodUrl;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost') return `http://${host}:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
};

/// Lives apart from the axios instance so the connectivity module can probe the API
/// without importing axios - which imports connectivity back to report failures.
export const baseURL = resolveBaseUrl();

export const healthUrl = `${baseURL}/health`;
