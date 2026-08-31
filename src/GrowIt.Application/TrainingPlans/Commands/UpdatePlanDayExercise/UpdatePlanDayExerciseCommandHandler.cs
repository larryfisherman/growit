using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDayExercise;

public class UpdatePlanDayExerciseCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdatePlanDayExerciseCommand>
{
    public async Task Handle(UpdatePlanDayExerciseCommand request, CancellationToken cancellationToken)
    {
        var exercise = await dbContext.TrainingPlanDayExercises
            .FirstOrDefaultAsync(
                e => e.Id == request.PlanDayExerciseId && e.PlanDay.Plan.UserId == request.UserId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Plan day exercise {request.PlanDayExerciseId} not found");

        exercise.TargetSets = request.TargetSets;
        exercise.TargetReps = request.TargetReps;
        exercise.RestSeconds = request.RestSeconds;
        exercise.OrderIndex = request.OrderIndex;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
