import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { refreshSession } from '../auth/cognito';
import { getAccessToken, getRefreshToken, saveSession } from '../auth/tokenStorage';
import { notifySessionExpired } from '../auth/sessionExpiry';

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

const baseURL = resolveBaseUrl();

const AXIOS_INSTANCE = axios.create({ baseURL });

AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


let refreshInFlight: Promise<string | null> | null = null;

const runRefresh = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const session = await refreshSession(refreshToken);
    await saveSession(session);
    return session.tokens.accessToken;
  } catch {
    return null;
  }
};

const refreshAccessToken = (): Promise<string | null> => {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

type RetriableConfig = InternalAxiosRequestConfig & { retried?: boolean };

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status !== 401 || !config || config.retried) {
      return Promise.reject(error);
    }

    config.retried = true;

    const accessToken = await refreshAccessToken();
    if (!accessToken) {
      notifySessionExpired();
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${accessToken}`;
    return AXIOS_INSTANCE(config);
  },
);

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  AXIOS_INSTANCE(config).then(({ data }) => data);
