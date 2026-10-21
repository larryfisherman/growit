// Explicit extension: this module is loaded both by Metro and by node --test, and
// Node's ESM resolution will not guess it.
import {
  isPermanentError,
  isServerUnavailable,
  isSessionUnavailable,
  isTransportError,
} from '../api/errors.ts';
import { isRetiredClientError } from './retiredClient.ts';

/// How many times a write is retried after its first attempt, split by what went wrong.
///
/// A request that never landed is the circuit breaker's business, not the budget's: it
/// will flip the app offline and pause this write, and a write about to be paused must
/// not also be running out of attempts. That is why transport failures get a generous
/// allowance - it exists only so a half-working API cannot keep one write spinning
/// forever, not to decide when to give up on a bad link.
///
/// A server that answers, and keeps answering badly, is a different matter and worth far
/// less patience.
export const MAX_TRANSPORT_RETRIES = 20;
export const MAX_SERVER_ERROR_RETRIES = 3;

/// TanStack calls this before counting the failure, so failureCount is 0 on the first
/// one. `failureCount < n` therefore means n retries on top of the original attempt.
export const shouldRetryWrite = (failureCount: number, error: unknown): boolean => {
  // The client was torn down (sign-out, session expiry). Its queue is on disk and goes
  // out with the next session of the same user; this copy must not try again.
  if (isRetiredClientError(error)) return false;
  // Waiting for a token is not a failure of the write, so it has no budget to run out
  // of. The back-off is capped, so this costs one cheap attempt every half minute.
  if (isSessionUnavailable(error)) return true;
  if (isPermanentError(error)) return false;
  if (isTransportError(error) || isServerUnavailable(error)) {
    return failureCount < MAX_TRANSPORT_RETRIES;
  }
  return failureCount < MAX_SERVER_ERROR_RETRIES;
};
