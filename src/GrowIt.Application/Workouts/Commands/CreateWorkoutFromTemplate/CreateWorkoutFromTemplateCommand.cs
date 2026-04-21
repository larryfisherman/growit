using MediatR;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromTemplate;

public record CreateWorkoutFromTemplateCommand(
    Guid UserId,
    Guid TemplateId,
    DateOnly PerformedAt
) : IRequest<Guid>;
