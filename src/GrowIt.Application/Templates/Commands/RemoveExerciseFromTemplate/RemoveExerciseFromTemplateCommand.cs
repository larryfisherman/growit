using MediatR;

namespace GrowIt.Application.Templates.Commands.RemoveExerciseFromTemplate;

public record RemoveExerciseFromTemplateCommand(Guid TemplateExerciseId) : IRequest<Unit>;
