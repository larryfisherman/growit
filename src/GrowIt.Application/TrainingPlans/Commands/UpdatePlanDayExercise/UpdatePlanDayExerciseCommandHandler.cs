using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDayExercise;

public class UpdatePlanDayExerciseCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdatePlanDayExerciseCommand>
{
    public async Task Handle(UpdatePlanDayExerciseCommand request, CancellationToken cancellationToken)
    {
        var exercise = await dbContext.TrainingPlanDayExercises
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(e => e.Id == request.PlanDayExerciseId, cancellationToken)
            ?? throw new NotFoundException($"Plan day exercise {request.PlanDayExerciseId} not found");

        exercise.TargetSets = request.TargetSets;
        exercise.TargetReps = request.TargetReps;
        exercise.RestSeconds = request.RestSeconds;
        exercise.OrderIndex = request.OrderIndex;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
