using MediatR;

namespace GrowIt.Application.Workouts.Commands.DeleteSet;

public record DeleteSetCommand(Guid UserId, Guid SetId) : IRequest;
