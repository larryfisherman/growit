using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Application.TrainingPlans.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.DeleteTrainingPlan;

public class DeleteTrainingPlanCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<DeleteTrainingPlanCommand>
{
    public async Task Handle(DeleteTrainingPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await dbContext.TrainingPlans
            .Include(p => p.Days)
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(p => p.Id == request.PlanId, cancellationToken);

        // Nothing to delete is the outcome the caller asked for, so say so. A queued
        // delete can easily outlive its target: create and delete something offline,
        // have the create fail for good, and the delete then arrives at an empty spot.
        if (plan is null) return;

        var dayIds = plan.Days.Select(d => d.Id).ToList();
        await PlanDayWorkouts.DetachAsync(dbContext, dayIds, cancellationToken);

        // Losing the active plan would leave the today screen with nothing to suggest, so
        // the successor is chosen before anything is written. Two separate saves would
        // leave a user with no active plan at all if the second never happened - a state
        // nothing later corrects.
        if (plan.IsActive)
        {
            var fallback = await dbContext.TrainingPlans
                .OwnedBy(request.UserId)
                .Where(p => p.Id != plan.Id)
                .OrderBy(p => p.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (fallback is not null)
            {
                fallback.IsActive = true;
            }
        }

        dbContext.TrainingPlans.Remove(plan);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
