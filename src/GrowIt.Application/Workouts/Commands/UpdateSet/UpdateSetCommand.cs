using MediatR;

namespace GrowIt.Application.Workouts.Commands.UpdateSet;

public record UpdateSetCommand(Guid UserId, Guid SetId, decimal WeightKg, int Reps) : IRequest;
