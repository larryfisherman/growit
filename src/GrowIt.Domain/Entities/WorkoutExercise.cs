namespace GrowIt.Domain.Entities;

public class WorkoutExercise
{
    public Guid Id { get; set; }
    public Guid WorkoutId { get; set; }
    public Guid ExerciseId { get; set; }
    public int OrderIndex { get; set; }

    public Workout Workout { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
    public ICollection<Set> Sets { get; set; } = [];
}
