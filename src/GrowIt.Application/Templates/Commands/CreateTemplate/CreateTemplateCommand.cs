using MediatR;

namespace GrowIt.Application.Templates.Commands.CreateTemplate;

public record CreateTemplateCommand(Guid UserId, string Name, string? Notes) : IRequest<Guid>;
