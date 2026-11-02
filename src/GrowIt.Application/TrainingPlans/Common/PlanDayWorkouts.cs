using GrowIt.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Common;

/// Unlinks performed workouts from plan days that are about to be deleted.
///
/// Workouts are history and outlive the day they came from. The Workout -> PlanDay FK has
/// no database-side ON DELETE action (EF ClientSetNull), so the rows must be loaded and
/// tracked, with PlanDayId nulled, in the same SaveChanges that deletes the day. Otherwise
/// Postgres rejects the delete with an FK violation, which GrowItDbContext reports as
/// NotFoundException - a confusing 404 on a delete.
public static class PlanDayWorkouts
{
    /// Nulls PlanDayId on every workout linked to `dayIds`. Does not save; the caller
    /// saves together with the delete.
    public static async Task DetachAsync(
        IApplicationDbContext dbContext,
        IReadOnlyCollection<Guid> dayIds,
        CancellationToken cancellationToken)
    {
        var workouts = await dbContext.Workouts
            .Where(w => w.PlanDayId != null && dayIds.Contains(w.PlanDayId.Value))
            .ToListAsync(cancellationToken);

        foreach (var workout in workouts)
        {
            workout.PlanDayId = null;
        }
    }
}
