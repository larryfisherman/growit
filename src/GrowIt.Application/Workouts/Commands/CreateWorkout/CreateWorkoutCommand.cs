using MediatR;

namespace GrowIt.Application.Workouts.Commands.CreateWorkout;

public record CreateWorkoutCommand(
    Guid Id,
    Guid UserId,
    string Name,
    DateOnly PerformedAt,
    string? Notes
) : IRequest<Guid>;
