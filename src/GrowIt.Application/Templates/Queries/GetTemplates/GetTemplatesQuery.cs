using MediatR;

namespace GrowIt.Application.Templates.Queries.GetTemplates;

public record GetTemplatesQuery(Guid UserId) : IRequest<List<TemplateSummary>>;

public record TemplateSummary(Guid Id, string Name, int ExerciseCount);
