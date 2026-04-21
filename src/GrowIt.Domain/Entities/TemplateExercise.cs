namespace GrowIt.Domain.Entities;

public class TemplateExercise
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public Guid? ExerciseId { get; set; }
    public string? CustomExerciseName { get; set; }
    public int TargetSets { get; set; }
    public int TargetReps { get; set; }
    public int RestSeconds { get; set; }
    public int OrderIndex { get; set; }

    public WorkoutTemplate Template { get; set; } = null!;
    public Exercise? Exercise { get; set; }
}
