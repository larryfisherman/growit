using MediatR;

namespace GrowIt.Application.Templates.Commands.UpdateTemplate;

public record UpdateTemplateCommand(Guid TemplateId, string Name, string? Notes) : IRequest<Unit>;
