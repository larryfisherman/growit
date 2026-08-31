namespace GrowIt.Domain.Entities;

/// An exercise planned for a day, either picked from the library (ExerciseId)
/// or typed in by hand (CustomExerciseName), never both.
public class TrainingPlanDayExercise
{
    public Guid Id { get; set; }
    public Guid PlanDayId { get; set; }
    public Guid? ExerciseId { get; set; }
    public string? CustomExerciseName { get; set; }
    public int TargetSets { get; set; }
    public int TargetReps { get; set; }
    public int RestSeconds { get; set; }
    public int OrderIndex { get; set; }
    public TrainingPlanDay PlanDay { get; set; } = null!;
    public Exercise? Exercise { get; set; }
}
