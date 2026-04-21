using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Commands.RemoveExerciseFromTemplate;

public class RemoveExerciseFromTemplateCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<RemoveExerciseFromTemplateCommand, Unit>
{
    public async Task<Unit> Handle(RemoveExerciseFromTemplateCommand request, CancellationToken cancellationToken)
    {
        var te = await dbContext.TemplateExercises
            .FirstOrDefaultAsync(x => x.Id == request.TemplateExerciseId, cancellationToken)
            ?? throw new KeyNotFoundException($"TemplateExercise {request.TemplateExerciseId} not found");

        dbContext.TemplateExercises.Remove(te);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
