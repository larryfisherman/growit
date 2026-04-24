import axios, { AxiosRequestConfig } from 'axios';

const AXIOS_INSTANCE = axios.create({
  baseURL: 'http://localhost:5050',
});

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  AXIOS_INSTANCE(config).then(({ data }) => data);
