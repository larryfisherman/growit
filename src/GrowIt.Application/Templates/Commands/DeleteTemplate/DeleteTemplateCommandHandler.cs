using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Commands.DeleteTemplate;

public class DeleteTemplateCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<DeleteTemplateCommand, Unit>
{
    public async Task<Unit> Handle(DeleteTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await dbContext.WorkoutTemplates
            .Include(t => t.TemplateExercises)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId, cancellationToken)
            ?? throw new KeyNotFoundException($"Template {request.TemplateId} not found");

        dbContext.WorkoutTemplates.Remove(template);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
