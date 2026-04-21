using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Commands.AddExerciseToTemplate;

public class AddExerciseToTemplateCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<AddExerciseToTemplateCommand, Guid>
{
    public async Task<Guid> Handle(AddExerciseToTemplateCommand request, CancellationToken cancellationToken)
    {
        var nextOrder = await dbContext.TemplateExercises
            .Where(te => te.TemplateId == request.TemplateId)
            .Select(te => (int?)te.OrderIndex)
            .MaxAsync(cancellationToken) ?? -1;

        var templateExercise = new TemplateExercise
        {
            Id = Guid.NewGuid(),
            TemplateId = request.TemplateId,
            ExerciseId = request.ExerciseId,
            CustomExerciseName = request.CustomExerciseName,
            TargetSets = request.TargetSets,
            TargetReps = request.TargetReps,
            RestSeconds = request.RestSeconds,
            OrderIndex = nextOrder + 1
        };

        dbContext.TemplateExercises.Add(templateExercise);
        await dbContext.SaveChangesAsync(cancellationToken);

        return templateExercise.Id;
    }
}
