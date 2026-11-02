namespace GrowIt.Domain.Entities;

/// An exercise within a performed workout: a library exercise (ExerciseId) and/or a custom
/// name (CustomExerciseName). A copy from the phone may carry both; the library name wins
/// when displayed (see GetWorkoutByIdQueryHandler).
/// Targets are copied from the plan day when the session starts from one; a row added
/// ad hoc may leave them null.
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
