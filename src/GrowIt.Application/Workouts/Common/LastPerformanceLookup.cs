using GrowIt.Application.Common.Interfaces;
using GrowIt.Contracts.Workouts.Responses;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Common;

/// A session's place in time, for asking what came before it. Two sessions can share a
/// date, so the moment it was recorded breaks the tie.
public sealed record SessionMoment(Guid WorkoutId, DateOnly PerformedAt, DateTime CreatedAt);

/// Finds, per library exercise, the most recent session in which the user logged at least
/// one set of it - the "last time" shown next to the exercise while logging.
///
/// Custom exercises have no library id to match on and are left out.
public static class LastPerformanceLookup
{
    /// `before` limits the search to sessions that came earlier than the given one: a
    /// session viewed in the calendar a month later should still compare itself with the
    /// one before it, not with everything since.
    public static async Task<IReadOnlyDictionary<Guid, LastPerformanceResponse>> FindAsync(
        IApplicationDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> exerciseIds,
        SessionMoment? before,
        CancellationToken cancellationToken)
    {
        if (exerciseIds.Count == 0) return new Dictionary<Guid, LastPerformanceResponse>();

        var candidates = dbContext.WorkoutExercises.Where(we =>
            we.ExerciseId != null
            && exerciseIds.Contains(we.ExerciseId.Value)
            && we.Workout.UserId == userId
            && we.Sets.Any());

        if (before is not null)
        {
            candidates = candidates.Where(we =>
                we.WorkoutId != before.WorkoutId
                && (we.Workout.PerformedAt < before.PerformedAt
                    || (we.Workout.PerformedAt == before.PerformedAt && we.Workout.CreatedAt < before.CreatedAt)));
        }

        // Only ids and dates come back here; the sets are read for the winners alone.
        var rows = await candidates
            .Select(we => new
            {
                ExerciseId = we.ExerciseId!.Value,
                we.Id,
                we.OrderIndex,
                we.Workout.PerformedAt,
                we.Workout.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        var latest = rows
            .GroupBy(r => r.ExerciseId)
            .Select(g => g
                .OrderByDescending(r => r.PerformedAt)
                .ThenByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.OrderIndex)
                .First())
            .ToList();

        var latestIds = latest.Select(r => r.Id).ToList();

        var sets = await dbContext.Sets
            .Where(s => latestIds.Contains(s.WorkoutExerciseId))
            .OrderBy(s => s.OrderIndex)
            .Select(s => new { s.WorkoutExerciseId, s.WeightKg, s.Reps })
            .ToListAsync(cancellationToken);

        var setsByRow = sets.ToLookup(s => s.WorkoutExerciseId);

        return latest.ToDictionary(
            r => r.ExerciseId,
            r => new LastPerformanceResponse(
                r.PerformedAt,
                setsByRow[r.Id].Select(s => new LastSetResponse(s.WeightKg, s.Reps)).ToList()));
    }
}
