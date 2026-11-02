# Offline-first writes

Every write the mobile app makes goes through one persisted queue. The user sees the result
at once, the request goes out when the API is reachable, and the backend accepts a replay
of the same write without doing it twice. This page is the map. The reasoning for each step
is in the comments of the files named here.

## The flow

```
screen calls an orval mutation hook (usePostApiTrainingPlans, ...)
  │  ids for new rows are minted on the device (offline/ids.ts, UUIDv7)
  ▼
1. enqueue        one scope for all writes -> strict FIFO   (writeScope.ts)
                  older desired-state copies dropped        (coalesce.ts)
  ▼
2. optimistic     onMutate patches the query cache          (mutationDefaults.ts, cachePatches.ts)
  ▼
3. send / pause   online  -> request goes out
                  offline -> mutation stays paused in the queue
                  queue + cache persisted per user          (persistence.ts, QueryLayer.tsx)
  ▼
4. replay         on reconnect or on next launch the paused queue resumes in order
                  retries by failure kind                   (retryPolicy.ts, api/errors.ts)
  ▼
5. settle         refetch the touched query families once the queue is empty (optimistic.ts)
                  a write that finally fails -> lost-writes banner (failedWrites.ts)
  ▼
backend: client-supplied id already ours, same parent -> 200, nothing changes
         (GrowIt.Application/Common/Idempotency/IdempotencyGuard.cs)
```

## Where each piece lives (`mobile/src/offline`)

| Step | Files | What to know |
|---|---|---|
| Registry | `mutationDefaults.ts`, `queryClient.ts` | Every write's `mutationFn`, optimistic patch and touched query families are registered with `setMutationDefaults`, built from orval's factories. A write restored from disk has no component behind it, so its behaviour must come from here. Screens never pass `onSuccess` to the hook; UI effects go to `mutate(vars, { onSuccess })`. |
| Ordering | `writeScope.ts`, `coalesce.ts` | All writes share `WRITE_SCOPE`, so a child never arrives before its parent. Writes that carry the whole desired state (renames, reorders) are registered as supersedable and coalesced. Creates and logged sets never are. |
| Optimistic patch | `optimistic.ts`, `cachePatches.ts`, `queryKeys.ts` | No snapshot or rollback: a resumed write never re-runs `onMutate`. A failed write is undone by the refetch in `onSettled`. |
| Persistence | `persistence.ts`, `QueryLayer.tsx`, `pendingWrites.ts` | One AsyncStorage entry per user. Every unsent write is saved as paused (with no error object, which would carry the auth header). `CACHE_VERSION` drops cached reads but keeps the queue. |
| Connectivity | `connectionState.ts` (pure), `connectivity.ts`, `useConnectivity.ts`, `ConnectionBanner.tsx` | Circuit breaker over NetInfo: repeated transport failures mark the app offline, and a `/health` probe brings it back. This module is the only writer of TanStack's `onlineManager`, which pauses and resumes the queue. |
| Retry | `retryPolicy.ts`, `../api/errors.ts` | Transport failures and 502/503/504 get a large budget (the breaker pauses the queue first). Other 5xx get 3 retries. 4xx (except 408/429) is permanent. |
| Lost writes | `failedWrites.ts`, `LostWritesBanner.tsx` | Counts writes that stopped retrying, so the user knows the screen may show data the server refused. |
| Session end | `retiredClient.ts`, `queryClient.ts` | Sign-out or session expiry unmounts the per-user client. Its queue stays on disk for that user, and the old client refuses to send anything with someone else's token. |
| Debounced edits | `useDebouncedWrite.ts` | Text edits are debounced, and still flushed when the screen unmounts or the app goes to background. |

## Backend side

- Create endpoints take the row id from the client. `IdempotencyGuard` / `IdempotentCreate`
  answer a repeat as success when the id is already ours under the same parent, and with 409
  when it belongs to another user or another parent. A concurrent duplicate that hits the
  unique key is checked the same way, in `SaveCreateAsync`.
- Updates (PUT) send the full desired state, so replaying one is harmless.
- Deletes and removes answer success when the row is already gone. A queued delete can
  arrive after its target was never created or was deleted elsewhere.
- `tests/GrowIt.Integration.Tests/OfflineReplayTests.cs` and `IdempotentCreateTests.cs` pin
  this behaviour. The mobile side is covered by `mobile/src/offline/*.test.ts` (queue,
  ordering, coalescing, persistence, outage, session, lost writes).

## Adding a new write

1. Add the endpoint on the backend. For a create, take the id in the request and use
   `IdempotentCreate` in the handler.
2. Run `pnpm api:gen` in `mobile/`.
3. Register the mutation in `mutationDefaults.ts` with `register(...)` (or
   `registerDesiredState(...)` if the request carries the full target state). Give it the
   query families it touches and an optimistic patch.
4. Call the generated hook from the screen with no callbacks in its options.
