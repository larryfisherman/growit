import { AppState } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { baseURL, healthUrl } from '../api/baseUrl';

export type ConnectionStatus = 'online' | 'unstable' | 'offline';

/// Transport failures tolerated before we warn, and before we stop claiming to be
/// online. A flaky connection reports "connected" the entire time it is failing, so
/// counting dropped requests is the only thing that tells the two apart.
const UNSTABLE_AFTER = 3;
const CIRCUIT_OPENS_AFTER = 5;

/// Backoff for the health probe while the circuit is open; the last delay repeats.
const PROBE_DELAYS_MS = [15_000, 30_000, 60_000];
const PROBE_TIMEOUT_MS = 5_000;

let netInfoOnline = true;
let consecutiveFailures = 0;
let circuitOpen = false;
let forcedOffline = false;

let probeTimer: ReturnType<typeof setTimeout> | null = null;
let probeAttempt = 0;

let status: ConnectionStatus = 'online';
const listeners = new Set<() => void>();

const computeStatus = (): ConnectionStatus => {
  if (forcedOffline || !netInfoOnline || circuitOpen) return 'offline';
  return consecutiveFailures >= UNSTABLE_AFTER ? 'unstable' : 'online';
};

const publish = () => {
  const next = computeStatus();

  // onlineManager is the gate TanStack Query checks before firing a request or
  // resuming a paused mutation, and this module is its only writer. Letting NetInfo
  // drive it directly would reopen the tap on the next wifi event, undoing a circuit
  // we opened because requests were actually failing. 'unstable' still counts as
  // online - we want those requests attempted, just flagged.
  onlineManager.setOnline(next !== 'offline');

  if (next === status) return;
  status = next;
  listeners.forEach((listener) => listener());
};

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

const runProbe = async () => {
  probeTimer = null;
  probeAttempt += 1;

  // No link at all - NetInfo will tell us the moment that changes, so burning
  // battery on probes here buys nothing.
  if (!netInfoOnline || forcedOffline) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(healthUrl, { signal: controller.signal });
    if (response.ok) {
      closeCircuit();
      return;
    }
  } catch {
    // Still down.
  } finally {
    clearTimeout(timeout);
  }

  scheduleProbe();
};

const openCircuit = () => {
  if (circuitOpen) return;
  circuitOpen = true;
  probeAttempt = 0;
  publish();
  scheduleProbe();
};

const closeCircuit = () => {
  circuitOpen = false;
  consecutiveFailures = 0;
  stopProbing();
  publish();
};

const handleNetInfo = (state: NetInfoState) => {
  // isInternetReachable stays null until the first reachability check lands. Reading
  // unknown as offline would pause every request during app start.
  const next = state.isConnected === true && state.isInternetReachable !== false;
  if (next === netInfoOnline) return;

  netInfoOnline = next;
  if (next) {
    // The link came back - give the API an immediate chance instead of sitting out
    // the rest of a 60s backoff.
    consecutiveFailures = 0;
    circuitOpen = false;
  }
  stopProbing();
  publish();
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
  // and every write here goes through publish() instead. The returned cleanup matters:
  // onSubscribe reinstalls the setup whenever it finds none, which would re-run this
  // on every QueryClient mount.
  onlineManager.setEventListener(() => () => {});

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) =>
      handleFocus(state === 'active'),
    );
    return () => subscription.remove();
  });

  if (__DEV__) console.log('[net] connectivity watching', baseURL);
};

/// Called from the axios response interceptor on every settled request.
export const reportRequestSuccess = () => {
  if (consecutiveFailures === 0 && !circuitOpen) return;
  closeCircuit();
};

/// Transport failures only - a 4xx/5xx means the network is fine and the server
/// disagreed with us, which says nothing about connectivity.
export const reportTransportFailure = () => {
  consecutiveFailures += 1;
  if (consecutiveFailures >= CIRCUIT_OPENS_AFTER) {
    openCircuit();
    return;
  }
  publish();
};

export const subscribeToConnection = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getConnectionStatus = (): ConnectionStatus => status;

/// Dev-only escape hatch behind the settings toggle: exercises the exact path
/// production uses, without touching the device radio.
export const forceOffline = (value: boolean) => {
  forcedOffline = value;
  if (!value) {
    consecutiveFailures = 0;
    circuitOpen = false;
  }
  stopProbing();
  publish();
};

export const isForcedOffline = () => forcedOffline;
