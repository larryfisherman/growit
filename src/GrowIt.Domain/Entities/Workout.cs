namespace GrowIt.Domain.Entities;

public class Workout
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly PerformedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = [];
}
