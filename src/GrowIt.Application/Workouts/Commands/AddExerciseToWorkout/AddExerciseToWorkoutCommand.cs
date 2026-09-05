using MediatR;

namespace GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;

public record AddExerciseToWorkoutCommand(
    Guid Id,
    Guid UserId,
    Guid WorkoutId,
    Guid ExerciseId,
    int OrderIndex,
    int? TargetSets,
    int? TargetReps,
    int? RestSeconds) : IRequest<Guid>;
