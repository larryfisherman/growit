namespace GrowIt.Domain.Entities;

/// A single day of a plan, e.g. "Push A". Holds what is meant to be done -
/// the weights actually lifted live on Workout instead.
public class TrainingPlanDay
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Notes { get; set; }

    /// Position within the plan. Defaults to the order days were added and is
    /// rewritten when they are dragged around.
    public int OrderIndex { get; set; }

    public DateTime CreatedAt { get; set; }
    public TrainingPlan Plan { get; set; } = null!;
    public ICollection<TrainingPlanDayExercise> Exercises { get; set; } = [];
}
