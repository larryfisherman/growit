using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.UpdateTrainingPlan;

public class UpdateTrainingPlanCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdateTrainingPlanCommand>
{
    public async Task Handle(UpdateTrainingPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await dbContext.TrainingPlans
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(p => p.Id == request.PlanId, cancellationToken)
            ?? throw new NotFoundException($"Training plan {request.PlanId} not found");

        plan.Name = request.Name;
        plan.Notes = request.Notes;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
