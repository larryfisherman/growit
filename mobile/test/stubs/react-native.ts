/// Only what the offline layer touches: connectivity.ts listens to AppState for focus.
export const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
};

export const Platform = { OS: 'ios', select: <T>(options: { ios?: T; default?: T }) => options.ios ?? options.default };
