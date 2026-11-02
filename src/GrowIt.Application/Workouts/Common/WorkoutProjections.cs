using System.Linq.Expressions;
using GrowIt.Contracts.Workouts.Responses;
using GrowIt.Domain.Entities;

namespace GrowIt.Application.Workouts.Common;

/// Shared EF projections for workout list queries, so every list returns the same shape.
public static class WorkoutProjections
{
    /// One row per workout for history and calendar lists. GetWorkoutByDate mirrors this
    /// field for field in its own DTO; keep the two in sync.
    public static readonly Expression<Func<Workout, WorkoutSummaryResponse>> Summary = w => new WorkoutSummaryResponse(
        w.Id,
        w.Name,
        w.PerformedAt,
        w.WorkoutExercises.Count,
        w.PlanDayId,
        w.PlanDay != null ? w.PlanDay.Name : null);
}
