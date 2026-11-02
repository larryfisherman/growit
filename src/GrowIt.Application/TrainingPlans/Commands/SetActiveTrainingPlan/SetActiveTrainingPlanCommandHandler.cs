using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.SetActiveTrainingPlan;

public class SetActiveTrainingPlanCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<SetActiveTrainingPlanCommand>
{
    public async Task Handle(SetActiveTrainingPlanCommand request, CancellationToken cancellationToken)
    {
        var plans = await dbContext.TrainingPlans
            .OwnedBy(request.UserId)
            .ToListAsync(cancellationToken);

        if (plans.All(p => p.Id != request.PlanId))
        {
            throw new NotFoundException($"Training plan {request.PlanId} not found");
        }

        // Exactly one plan is active, so flipping one on turns the rest off.
        foreach (var plan in plans)
        {
            plan.IsActive = plan.Id == request.PlanId;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
