using GrowIt.Contracts.Templates.Responses;
using MediatR;

namespace GrowIt.Application.Templates.Queries.GetTemplates;

public record GetTemplatesQuery(Guid UserId) : IRequest<List<TemplateSummaryResponse>>;
