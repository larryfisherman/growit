using GrowIt.Domain.Entities;

namespace GrowIt.Application.Common.Ownership;

/// Limits a query to the rows one user owns.
///
/// Every ownership check on user data goes through this filter, and each entity's path to
/// its owner is defined here once. The deliberate exceptions are the ExistingRow
/// projections passed to IdempotencyGuard, which must see every owner's rows to detect a
/// taken id (adding OwnedBy there would break its "someone else holds it" check), and
/// PlanDayWorkouts.DetachAsync, which is scoped by day ids already checked for ownership.
///
/// The filter has been left out of handlers before, and any valid token could then reach
/// any user's rows by id. A row that is missing and a row that belongs to someone else
/// look identical to the caller (404, null, or a no-op delete, depending on the endpoint),
/// so another user's id is never confirmed.
///
/// Each method is a plain Where, so EF Core translates it into the same SQL the inline
/// predicates produced.
public static class OwnershipQueries
{
    public static IQueryable<TrainingPlan> OwnedBy(this IQueryable<TrainingPlan> query, Guid userId) =>
        query.Where(p => p.UserId == userId);

    public static IQueryable<TrainingPlanDay> OwnedBy(this IQueryable<TrainingPlanDay> query, Guid userId) =>
        query.Where(d => d.Plan.UserId == userId);

    public static IQueryable<TrainingPlanDayExercise> OwnedBy(
        this IQueryable<TrainingPlanDayExercise> query, Guid userId) =>
        query.Where(e => e.PlanDay.Plan.UserId == userId);

    public static IQueryable<Workout> OwnedBy(this IQueryable<Workout> query, Guid userId) =>
        query.Where(w => w.UserId == userId);

    public static IQueryable<WorkoutExercise> OwnedBy(this IQueryable<WorkoutExercise> query, Guid userId) =>
        query.Where(e => e.Workout.UserId == userId);

    public static IQueryable<Set> OwnedBy(this IQueryable<Set> query, Guid userId) =>
        query.Where(s => s.WorkoutExercise.Workout.UserId == userId);
}
