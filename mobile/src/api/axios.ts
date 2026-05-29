import axios, { AxiosRequestConfig } from 'axios';
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

const baseURL = resolveBaseUrl();

const AXIOS_INSTANCE = axios.create({ baseURL });

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  AXIOS_INSTANCE(config).then(({ data }) => data);
