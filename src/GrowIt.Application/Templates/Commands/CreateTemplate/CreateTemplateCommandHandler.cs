using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;

namespace GrowIt.Application.Templates.Commands.CreateTemplate;

public class CreateTemplateCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<CreateTemplateCommand, Guid>
{
    public async Task<Guid> Handle(CreateTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = new WorkoutTemplate
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.WorkoutTemplates.Add(template);
        await dbContext.SaveChangesAsync(cancellationToken);

        return template.Id;
    }
}
