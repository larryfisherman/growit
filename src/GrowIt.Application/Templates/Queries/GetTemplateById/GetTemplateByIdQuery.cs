using MediatR;

namespace GrowIt.Application.Templates.Queries.GetTemplateById;

public record GetTemplateByIdQuery(Guid TemplateId) : IRequest<TemplateDetailResponse?>;

public record TemplateDetailResponse(
    Guid Id,
    string Name,
    string? Notes,
    IReadOnlyList<TemplateExerciseDetail> Exercises);

public record TemplateExerciseDetail(
    Guid Id,
    Guid? ExerciseId,
    string ExerciseName,
    string? Category,
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex);
