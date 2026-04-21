namespace GrowIt.Domain.Entities;

public class WorkoutExercise
{
    public Guid Id { get; set; }
    public Guid WorkoutId { get; set; }
    public Guid? ExerciseId { get; set; }
    public string? CustomExerciseName { get; set; }
    public int? TargetSets { get; set; }
    public int? TargetReps { get; set; }
    public int? RestSeconds { get; set; }
    public int OrderIndex { get; set; }

    public Workout Workout { get; set; } = null!;
    public Exercise? Exercise { get; set; }
    public ICollection<Set> Sets { get; set; } = [];
}
