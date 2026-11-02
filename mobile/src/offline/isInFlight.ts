/// Whether a mutation is actually on the wire right now - the state a control should wait on.
///
/// A paused write stays pending for as long as there is no signal, so binding a control to
/// isPending alone leaves it spinning and disabled until the network returns. Only a write
/// actually in flight is worth waiting on.
export const isInFlight = (mutation: { isPending: boolean; isPaused: boolean }) =>
  mutation.isPending && !mutation.isPaused;
