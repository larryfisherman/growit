using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.RemoveExerciseFromPlanDay;

public class RemoveExerciseFromPlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<RemoveExerciseFromPlanDayCommand>
{
    public async Task Handle(RemoveExerciseFromPlanDayCommand request, CancellationToken cancellationToken)
    {
        var exercise = await dbContext.TrainingPlanDayExercises
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(e => e.Id == request.PlanDayExerciseId, cancellationToken);

        // Already gone is the requested state; see DeleteTrainingPlanCommandHandler.
        if (exercise is null) return;

        dbContext.TrainingPlanDayExercises.Remove(exercise);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
