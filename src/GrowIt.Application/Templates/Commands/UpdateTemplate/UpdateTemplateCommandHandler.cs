using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Commands.UpdateTemplate;

public class UpdateTemplateCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdateTemplateCommand, Unit>
{
    public async Task<Unit> Handle(UpdateTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await dbContext.WorkoutTemplates
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId, cancellationToken)
            ?? throw new KeyNotFoundException($"Template {request.TemplateId} not found");

        template.Name = request.Name;
        template.Notes = request.Notes;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
