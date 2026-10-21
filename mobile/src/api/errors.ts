/// Classifies request failures so the rest of the app can answer one question:
/// is it worth trying this again?
///
/// Duck-typed rather than keyed off `instanceof AxiosError` so the rules stay pure
/// and testable, and so a wrapped or re-thrown error is still read correctly.

type HttpErrorLike = { response?: { status?: number } };

const statusOf = (error: unknown): number | undefined => {
  const response = (error as HttpErrorLike | null | undefined)?.response;
  return typeof response?.status === 'number' ? response.status : undefined;
};

export const httpStatusOf = statusOf;

/// The request never got a verdict: no response came back at all. This is the only
/// failure that says anything about connectivity, and the only one worth queueing on.
export const isTransportError = (error: unknown): boolean => statusOf(error) === undefined;

/// The server answered and would answer the same way next time, so retrying is just
/// noise - and, for a queued write, an infinite loop. 408 and 429 are carved out
/// because both explicitly invite another attempt.
export const isPermanentError = (error: unknown): boolean => {
  const status = statusOf(error);
  if (status === undefined) return false;
  if (status === 408 || status === 429) return false;
  return status >= 400 && status < 500;
};

/// The server is not there to judge the request: a gateway with nothing behind it, a
/// deploy, a container restarting. That is the backend being away, not disagreeing, so
/// for the queue it is the same as a link that went down.
export const isServerUnavailable = (error: unknown): boolean => {
  const status = statusOf(error);
  return status === 502 || status === 503 || status === 504;
};

/// The token was too old to send and Cognito could not be reached to swap it. The API
/// never got to judge the write - the 401 it answered says nothing about the write, only
/// that we had no valid token yet - so the write waits for one rather than being dropped.
export class SessionUnavailableError extends Error {
  constructor() {
    super('The session could not be refreshed; the request was not authorised.');
    this.name = 'SessionUnavailableError';
  }
}

export const isSessionUnavailable = (error: unknown): boolean =>
  error instanceof SessionUnavailableError;

/// Someone else's row, or ours arriving twice. Worth telling apart because it is the
/// one permanent failure the offline queue can produce by itself.
export const isConflict = (error: unknown): boolean => statusOf(error) === 409;
