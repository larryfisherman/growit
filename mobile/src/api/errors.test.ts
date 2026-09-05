/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isConflict, isPermanentError, isTransportError } from './errors.ts';

const responded = (status: number) => Object.assign(new Error(`HTTP ${status}`), {
  response: { status },
});

/// What axios throws when the request never landed: no `response` at all.
const neverLanded = () => Object.assign(new Error('Network Error'), { code: 'ECONNABORTED' });

describe('isTransportError', () => {
  test('true when nothing came back', () => {
    assert.equal(isTransportError(neverLanded()), true);
  });

  test('false for every answered request, including server errors', () => {
    for (const status of [200, 400, 401, 409, 500, 503]) {
      assert.equal(isTransportError(responded(status)), false, `status ${status}`);
    }
  });
});

describe('isPermanentError', () => {
  test('4xx will not change its mind, so retrying is pointless', () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      assert.equal(isPermanentError(responded(status)), true, `status ${status}`);
    }
  });

  test('5xx is worth another try - the server may just be restarting', () => {
    for (const status of [500, 502, 503]) {
      assert.equal(isPermanentError(responded(status)), false, `status ${status}`);
    }
  });

  test('408 and 429 explicitly invite a retry', () => {
    assert.equal(isPermanentError(responded(408)), false);
    assert.equal(isPermanentError(responded(429)), false);
  });

  test('a request that never landed is never permanent - that is the whole point', () => {
    // Getting this wrong would drop queued writes the moment the user walks
    // out of signal.
    assert.equal(isPermanentError(neverLanded()), false);
  });
});

describe('isConflict', () => {
  test('spots 409 and nothing else', () => {
    assert.equal(isConflict(responded(409)), true);
    assert.equal(isConflict(responded(400)), false);
    assert.equal(isConflict(neverLanded()), false);
  });
});

describe('junk input', () => {
  test('does not throw on null, undefined or a bare string', () => {
    for (const value of [null, undefined, 'boom', 42, {}]) {
      assert.equal(isPermanentError(value), false);
      assert.equal(isConflict(value), false);
    }
  });
});
