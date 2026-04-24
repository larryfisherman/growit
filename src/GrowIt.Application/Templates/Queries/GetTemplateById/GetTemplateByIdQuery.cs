using GrowIt.Contracts.Templates.Responses;
using MediatR;

namespace GrowIt.Application.Templates.Queries.GetTemplateById;

public record GetTemplateByIdQuery(Guid TemplateId) : IRequest<TemplateResponse?>;
