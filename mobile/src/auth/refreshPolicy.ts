/// When a stored access token should be swapped before use. Kept apart from the
/// request path so it carries no Cognito or SecureStore dependency - and so the
/// upgrade case below is pinned down by a test rather than by hope.

/// Refresh this far ahead of expiry, so a burst of queued writes does not each spend
/// a 401 discovering the token died.
export const EXPIRY_MARGIN_MS = 60_000;

export const needsRefresh = (
  expiresAt: number,
  now: number,
  marginMs: number = EXPIRY_MARGIN_MS,
): boolean => expiresAt - now <= marginMs;
