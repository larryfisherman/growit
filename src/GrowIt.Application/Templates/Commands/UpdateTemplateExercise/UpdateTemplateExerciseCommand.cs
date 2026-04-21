using MediatR;

namespace GrowIt.Application.Templates.Commands.UpdateTemplateExercise;

public record UpdateTemplateExerciseCommand(
    Guid TemplateExerciseId,
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex
) : IRequest<Unit>;
