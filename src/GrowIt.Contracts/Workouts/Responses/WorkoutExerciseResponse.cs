namespace GrowIt.Contracts.Workouts.Responses;

public record WorkoutExerciseResponse(
    Guid Id,
    Guid? ExerciseId,
    string ExerciseName,
    string? Category,
    int? TargetSets,
    int? TargetReps,
    int? RestSeconds,
    int OrderIndex,
    IReadOnlyList<SetResponse> Sets);
