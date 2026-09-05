/// The system half of connectivity: NetInfo, timers, and the onlineManager flag.
/// Every decision about what the state should be lives in connectionState.ts.

import { AppState } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { baseURL, healthUrl } from '../api/baseUrl';
import {
  ConnectionEvent,
  ConnectionStatus,
  initialConnectionState,
  reduceConnection,
  shouldProbe,
  statusOf,
} from './connectionState';

export type { ConnectionStatus };

/// Backoff for the health probe while the circuit is open; the last delay repeats.
const PROBE_DELAYS_MS = [15_000, 30_000, 60_000];
const PROBE_TIMEOUT_MS = 5_000;

let state = initialConnectionState;
let status = statusOf(state);
const listeners = new Set<() => void>();

let probeTimer: ReturnType<typeof setTimeout> | null = null;
let probeAttempt = 0;

const stopProbing = () => {
  if (probeTimer) clearTimeout(probeTimer);
  probeTimer = null;
  probeAttempt = 0;
};

const scheduleProbe = () => {
  if (probeTimer) return;
  const delay = PROBE_DELAYS_MS[Math.min(probeAttempt, PROBE_DELAYS_MS.length - 1)];
  probeTimer = setTimeout(() => void runProbe(), delay);
};

const dispatch = (event: ConnectionEvent) => {
  const previous = state;
  state = reduceConnection(previous, event);

  // onlineManager is the gate TanStack Query checks before firing a request or
  // resuming a paused mutation, and this module is its only writer. Letting NetInfo
  // drive it directly would reopen the tap on the next wifi event, undoing a circuit
  // we opened because requests were actually failing. 'unstable' still counts as
  // online - we want those requests attempted, just flagged.
  onlineManager.setOnline(statusOf(state) !== 'offline');

  const wantsProbe = shouldProbe(state);
  if (wantsProbe) {
    if (!shouldProbe(previous)) probeAttempt = 0;
    scheduleProbe();
  } else {
    stopProbing();
  }

  const next = statusOf(state);
  if (next === status) return;
  status = next;
  listeners.forEach((listener) => listener());
};

const runProbe = async () => {
  probeTimer = null;
  probeAttempt += 1;
  if (!shouldProbe(state)) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(healthUrl, { signal: controller.signal });
    if (response.ok) {
      dispatch({ type: 'probe-succeeded' });
      return;
    }
  } catch {
    // Still down.
  } finally {
    clearTimeout(timeout);
  }

  if (shouldProbe(state)) scheduleProbe();
};

const handleNetInfo = (netInfo: NetInfoState) => {
  // isInternetReachable stays null until the first reachability check lands. Reading
  // unknown as offline would pause every request during app start.
  dispatch({
    type: 'netinfo-changed',
    online: netInfo.isConnected === true && netInfo.isInternetReachable !== false,
  });
};

let started = false;

export const setupConnectivity = () => {
  if (started) return;
  started = true;

  // Point reachability at our own API. Plain `isConnected` cannot tell "wifi works"
  // from "wifi works but the API is down, or a captive portal is eating requests" -
  // and the second case is the one that silently drains writes into timeouts.
  NetInfo.configure({
    reachabilityUrl: healthUrl,
    reachabilityTest: async (response) => response.status === 200,
    reachabilityLongTimeout: 60_000,
    reachabilityShortTimeout: 5_000,
    reachabilityRequestTimeout: PROBE_TIMEOUT_MS,
  });

  NetInfo.addEventListener(handleNetInfo);
  void NetInfo.fetch().then(handleNetInfo);

  // Take the flag outright. The stock listener is a web one (window online/offline),
  // and every write here goes through dispatch() instead. The returned cleanup matters:
  // onSubscribe reinstalls the setup whenever it finds none, which would re-run this
  // on every QueryClient mount.
  onlineManager.setEventListener(() => () => {});

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (appState) =>
      handleFocus(appState === 'active'),
    );
    return () => subscription.remove();
  });

  if (__DEV__) console.log('[net] connectivity watching', baseURL);
};

/// Any response at all, including 4xx/5xx: the network carried the request and the
/// server disagreed, which says nothing about connectivity.
export const reportRequestSettled = () => dispatch({ type: 'request-settled' });

/// A request that never landed - the only kind that counts against the breaker.
export const reportTransportFailure = () => dispatch({ type: 'transport-failed' });

export const subscribeToConnection = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getConnectionStatus = (): ConnectionStatus => status;

/// Dev-only escape hatch behind the settings toggle: exercises the exact path
/// production uses, without touching the device radio.
export const forceOffline = (value: boolean) => dispatch({ type: 'forced-offline', value });

export const isForcedOffline = () => state.forcedOffline;
