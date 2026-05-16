import axios, { AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

const API_PORT = 5050;

// Resolve API host:
// - Dev on device/simulator: use Mac's LAN IP from Expo dev server URL (hostUri = "192.168.1.x:8081")
// - Web / fallback: localhost
const resolveBaseUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost') return `http://${host}:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
};

const AXIOS_INSTANCE = axios.create({
  baseURL: resolveBaseUrl(),
});

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  AXIOS_INSTANCE(config).then(({ data }) => data);
