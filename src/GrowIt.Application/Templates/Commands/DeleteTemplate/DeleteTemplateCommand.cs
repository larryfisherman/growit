using MediatR;

namespace GrowIt.Application.Templates.Commands.DeleteTemplate;

public record DeleteTemplateCommand(Guid TemplateId) : IRequest<Unit>;
