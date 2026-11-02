namespace GrowIt.Domain.Entities;

/// One performed training session and the exercises and sets logged in it.
public class Workout
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    /// The user-facing training date.
    public DateOnly PerformedAt { get; set; }

    public string? Notes { get; set; }

    /// When the session was recorded; breaks ties between sessions on the same
    /// PerformedAt (see LastPerformanceLookup).
    public DateTime CreatedAt { get; set; }

    /// The plan day the session was started from, if any. Cleared, not cascaded, when that
    /// day or its plan is deleted (see TrainingPlans/Common/PlanDayWorkouts).
    public Guid? PlanDayId { get; set; }
    public TrainingPlanDay? PlanDay { get; set; }

    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = [];
}
