/// Connectivity in tests is driven through connectivity.ts itself (forceOffline), which
/// runs the same reducer and onlineManager path as a real NetInfo event.
const NetInfo = {
  configure: () => {},
  addEventListener: () => () => {},
  fetch: async () => ({ isConnected: true }),
};

export type NetInfoState = { isConnected: boolean | null };
export default NetInfo;
