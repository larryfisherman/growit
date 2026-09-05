using MediatR;

namespace GrowIt.Application.Workouts.Commands.LogSet;

public record LogSetCommand(
    Guid Id,
    Guid UserId,
    Guid WorkoutExerciseId,
    decimal WeightKg,
    int Reps,
    int OrderIndex) : IRequest<Guid>;
