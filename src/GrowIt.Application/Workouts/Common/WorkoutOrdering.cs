using GrowIt.Domain.Entities;

namespace GrowIt.Application.Workouts.Common;

/// The one order workout lists and lookups use, so every screen agrees on it.
public static class WorkoutOrdering
{
    /// Newest training date first; on a shared date, the most recently recorded session
    /// first. Without the second key Postgres returns same-date rows in no fixed order, so
    /// the day view could flip between sessions and history pages could repeat or skip
    /// one. LastPerformanceLookup and GetNextPlanDay break the same tie the same way.
    public static IOrderedQueryable<Workout> NewestFirst(this IQueryable<Workout> workouts) =>
        workouts
            .OrderByDescending(w => w.PerformedAt)
            .ThenByDescending(w => w.CreatedAt);
}
