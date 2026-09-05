import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { refreshSession } from '../auth/cognito';
import { getAccessToken, getRefreshToken, saveSession } from '../auth/tokenStorage';
import { notifySessionExpired } from '../auth/sessionExpiry';
import { reportRequestSuccess, reportTransportFailure } from '../offline/connectivity';
import { baseURL } from './baseUrl';

/// Without a ceiling a request on a dead network hangs for around a minute, which is
/// long enough that the circuit breaker never sees enough failures to trip.
const REQUEST_TIMEOUT_MS = 12_000;

const AXIOS_INSTANCE = axios.create({ baseURL, timeout: REQUEST_TIMEOUT_MS });

type TimedConfig = { metadata?: { start: number } };

AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (__DEV__) {
    (config as TimedConfig).metadata = { start: Date.now() };
    console.log('[api →]', config.method?.toUpperCase(), config.url);
  }

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
  (response) => {
    reportRequestSuccess();

    if (__DEV__) {
      const start = (response.config as TimedConfig).metadata?.start;
      const ms = start ? `${Date.now() - start}ms` : '?';
      console.log('[api ←]', response.status, response.config.url, ms);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    // A status code means the network carried the request and the server disagreed
    // with us - that says nothing about connectivity. Only a request that never
    // landed counts against the circuit breaker.
    if (error.response) reportRequestSuccess();
    else reportTransportFailure();

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
