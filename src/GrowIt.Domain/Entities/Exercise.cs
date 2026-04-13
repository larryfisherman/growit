namespace GrowIt.Domain.Entities;

public class Exercise
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = [];
}
