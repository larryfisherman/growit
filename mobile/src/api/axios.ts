import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { isCognitoRejection, refreshSession } from '../auth/cognito';
import { getAccessToken, getRefreshToken, saveSession } from '../auth/tokenStorage';
import { notifySessionExpired } from '../auth/sessionExpiry';
import { EXPIRY_MARGIN_MS, needsRefresh } from '../auth/refreshPolicy';
import { reportRequestSettled, reportTransportFailure } from '../offline/connectivity';
import { baseURL } from './baseUrl';

/// Without a ceiling a request on a dead network hangs for around a minute, which is
/// long enough that the circuit breaker never sees enough failures to trip.
const REQUEST_TIMEOUT_MS = 12_000;

/// After a refresh we could not reach, stop asking from every single request. Both the
/// 401 path and a recovered network will bring us back sooner than this if things heal.
const UNAVAILABLE_COOLDOWN_MS = 30_000;

const AXIOS_INSTANCE = axios.create({ baseURL, timeout: REQUEST_TIMEOUT_MS });

type TimedConfig = { metadata?: { start: number } };
type RetriableConfig = InternalAxiosRequestConfig & { retried?: boolean };

/// A refresh either worked, was refused, or never got an answer. Collapsing the last
/// two into a plain failure is what used to sign people out the moment they lost
/// signal - and the sign-out took the query cache with it.
type RefreshResult =
  | { status: 'ok'; token: string }
  | { status: 'expired' }
  | { status: 'unavailable' };

let refreshInFlight: Promise<RefreshResult> | null = null;
let unavailableUntil = 0;

const runRefresh = async (): Promise<RefreshResult> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return { status: 'expired' };

  try {
    const session = await refreshSession(refreshToken);
    await saveSession(session);
    return { status: 'ok', token: session.tokens.accessToken };
  } catch (error) {
    // Cognito answering "no" is the only thing that means the session is really gone.
    // A fetch that never landed means we simply do not know yet, and guessing wrong
    // costs the user everything they have not synced.
    return isCognitoRejection(error) ? { status: 'expired' } : { status: 'unavailable' };
  }
};

const refreshAccessToken = (): Promise<RefreshResult> => {
  if (Date.now() < unavailableUntil) return Promise.resolve({ status: 'unavailable' });

  refreshInFlight ??= runRefresh()
    .then((result) => {
      unavailableUntil =
        result.status === 'unavailable' ? Date.now() + UNAVAILABLE_COOLDOWN_MS : 0;
      return result;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

const authorizationToken = async (): Promise<string | null> => {
  const stored = await getAccessToken();
  if (!stored) return null;
  if (!needsRefresh(stored.expiresAt, Date.now(), EXPIRY_MARGIN_MS)) return stored.token;

  const result = await refreshAccessToken();
  // Refused or unreachable: send what we have. Offline the request fails on transport
  // anyway, and online it is the 401 path below that gets to decide about signing out.
  return result.status === 'ok' ? result.token : stored.token;
};

AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const token = await authorizationToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (__DEV__) {
    (config as TimedConfig).metadata = { start: Date.now() };
    console.log('[api →]', config.method?.toUpperCase(), config.url);
  }

  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    reportRequestSettled();

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
    if (error.response) reportRequestSettled();
    else reportTransportFailure();

    if (error.response?.status !== 401 || !config || config.retried) {
      return Promise.reject(error);
    }

    config.retried = true;

    const result = await refreshAccessToken();

    if (result.status === 'expired') {
      notifySessionExpired();
      return Promise.reject(error);
    }

    // No verdict came back. Keep the session and let the caller try again later -
    // signing out here would discard everything not yet synced.
    if (result.status === 'unavailable') return Promise.reject(error);

    config.headers.Authorization = `Bearer ${result.token}`;
    return AXIOS_INSTANCE(config);
  },
);

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  AXIOS_INSTANCE(config).then(({ data }) => data);
