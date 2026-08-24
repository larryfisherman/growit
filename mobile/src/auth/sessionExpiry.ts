// The axios interceptor lives outside React but has to tell the app when a session
// can no longer be refreshed. AuthProvider registers a handler here; keeping the
// registry in its own module stops axios.ts and AuthContext.tsx importing each other.

type Handler = () => void;

let handler: Handler | null = null;

export const setSessionExpiredHandler = (next: Handler | null) => {
  handler = next;
};

export const notifySessionExpired = () => {
  handler?.();
};
