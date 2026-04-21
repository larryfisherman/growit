using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutById;

public record GetWorkoutByIdQuery(Guid WorkoutId) : IRequest<WorkoutDetailResponse?>;

public record WorkoutDetailResponse(
    Guid Id,
    string Name,
    DateOnly PerformedAt,
    string? Notes,
    IReadOnlyList<WorkoutExerciseDetail> Exercises);

public record WorkoutExerciseDetail(
    Guid Id,
    Guid? ExerciseId,
    string ExerciseName,
    string? Category,
    int? TargetSets,
    int? TargetReps,
    int? RestSeconds,
    int OrderIndex,
    IReadOnlyList<SetDetail> Sets);

public record SetDetail(Guid Id, decimal WeightKg, int Reps, int OrderIndex);
