using GrowIt.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Common.Idempotency;

/// Decides what a create should do when the client picked the id.
///
/// Ids come from the client so a write can be composed offline, retried, and still
/// land exactly once. That makes the check below load-bearing rather than defensive:
/// with a server-generated Guid a caller could not name a row that did not exist yet,
/// and now it can.
public static class IdempotencyGuard
{
    /// Three outcomes for a client-supplied id:
    ///   nobody holds it   -> false, go ahead and insert
    ///   we hold it        -> true, the write already landed and this is a retry;
    ///                        answer success and change nothing
    ///   someone else does -> throw, because quietly taking it over is the one thing
    ///                        that must never happen
    ///
    /// The caller projects the owner, so each entity states its own path to a user -
    /// a plan owns itself, a set reaches back through its exercise and workout.
    public static async Task<bool> AlreadyCreatedAsync(
        IQueryable<Guid> ownerOfId,
        Guid id,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var owners = await ownerOfId.Take(1).ToListAsync(cancellationToken);

        if (owners.Count == 0) return false;
        if (owners[0] == userId) return true;

        throw new ConflictException($"Id {id} is already in use.");
    }
}
