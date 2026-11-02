namespace GrowIt.Domain.Entities;

/// One logged set of a workout exercise; OrderIndex comes from the client.
public class Set
{
    public Guid Id { get; set; }
    public Guid WorkoutExerciseId { get; set; }
    public decimal WeightKg { get; set; }
    public int Reps { get; set; }
    public int OrderIndex { get; set; }

    public WorkoutExercise WorkoutExercise { get; set; } = null!;
}
