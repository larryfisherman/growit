namespace GrowIt.Domain.Entities;

public class Set
{
    public Guid Id { get; set; }
    public Guid WorkoutExerciseId { get; set; }
    public decimal WeightKg { get; set; }
    public int Reps { get; set; }
    public int OrderIndex { get; set; }

    public WorkoutExercise WorkoutExercise { get; set; } = null!;
}
