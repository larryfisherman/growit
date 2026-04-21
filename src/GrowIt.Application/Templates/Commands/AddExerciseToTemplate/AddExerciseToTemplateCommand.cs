using MediatR;

namespace GrowIt.Application.Templates.Commands.AddExerciseToTemplate;

public record AddExerciseToTemplateCommand(
    Guid TemplateId,
    Guid? ExerciseId,
    string? CustomExerciseName,
    int TargetSets,
    int TargetReps,
    int RestSeconds
) : IRequest<Guid>;
