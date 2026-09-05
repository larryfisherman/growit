import { useSyncExternalStore } from 'react';
import { ConnectionStatus, getConnectionStatus, subscribeToConnection } from './connectivity';

export const useConnectivity = (): ConnectionStatus =>
  useSyncExternalStore(subscribeToConnection, getConnectionStatus);
