using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.UpdateTrainingPlan;

public class UpdateTrainingPlanCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdateTrainingPlanCommand>
{
    public async Task Handle(UpdateTrainingPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await dbContext.TrainingPlans
            .FirstOrDefaultAsync(p => p.Id == request.PlanId && p.UserId == request.UserId, cancellationToken)
            ?? throw new KeyNotFoundException($"Training plan {request.PlanId} not found");

        plan.Name = request.Name;
        plan.Notes = request.Notes;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
