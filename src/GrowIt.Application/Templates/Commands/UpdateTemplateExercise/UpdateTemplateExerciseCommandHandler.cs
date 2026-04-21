using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Commands.UpdateTemplateExercise;

public class UpdateTemplateExerciseCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdateTemplateExerciseCommand, Unit>
{
    public async Task<Unit> Handle(UpdateTemplateExerciseCommand request, CancellationToken cancellationToken)
    {
        var te = await dbContext.TemplateExercises
            .FirstOrDefaultAsync(x => x.Id == request.TemplateExerciseId, cancellationToken)
            ?? throw new KeyNotFoundException($"TemplateExercise {request.TemplateExerciseId} not found");

        te.TargetSets = request.TargetSets;
        te.TargetReps = request.TargetReps;
        te.RestSeconds = request.RestSeconds;
        te.OrderIndex = request.OrderIndex;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
