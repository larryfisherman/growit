/// Thrown instead of sending a write from a client that has been torn down.
///
/// A client is torn down when its user signs out or their session expires. Everything it
/// still had queued is already on disk under that user's key, and goes out when they sign
/// back in - from their new client, with their token. The old one must stop dead: left to
/// itself it keeps draining its queue with whatever token is in the Keychain by then,
/// which can be the next person's.
export class RetiredClientError extends Error {
  constructor() {
    super('This client belongs to a session that has ended.');
    this.name = 'RetiredClientError';
  }
}

export const isRetiredClientError = (error: unknown): boolean => error instanceof RetiredClientError;
