import { useEffect } from 'react';
import { useDebouncedWrite } from '../../../offline/useDebouncedWrite';

type Header = { name: string; notes: string | null };

type Args<TTarget> = {
  /// Whose header this is (a plan id, a day id). Null holds every write back.
  target: TTarget | null;
  /// The header as the server last returned it - the query data object itself, so the
  /// effect re-runs only when the server copy changes.
  saved: { name: string; notes?: string | null } | undefined;
  name: string;
  notes: string;
  write: (target: TTarget, header: Header) => void;
  delayMs?: number;
};

/// Saves a name + notes header a moment after typing stops, so the screen has no save
/// button. Shared by the plan and plan-day screens.
///
/// The optimistic patch and the invalidation live in the mutation registry; passing them
/// to the mutation here would override what is registered rather than add to it.
export const useNameNotesAutoSave = <TTarget>({
  target,
  saved,
  name,
  notes,
  write,
  delayMs = 600,
}: Args<TTarget>) => {
  // useDebouncedWrite keeps the writer in a ref, so a fresh `write` per render is fine.
  // The target is captured when the write is scheduled, not when it fires.
  const { schedule, cancel } = useDebouncedWrite<{ target: TTarget; header: Header }>(
    (p) => write(p.target, p.header),
    delayMs,
  );

  useEffect(() => {
    if (target === null || !saved) return;
    if (!name.trim()) return;

    const trimmedNotes = notes.trim() || null;
    if (name.trim() === saved.name && trimmedNotes === (saved.notes ?? null)) {
      // Typed back to where it started, so anything waiting to be sent is now void.
      cancel();
      return;
    }

    schedule({ target, header: { name: name.trim(), notes: trimmedNotes } });
  }, [name, notes, saved, target, schedule, cancel]);
};
