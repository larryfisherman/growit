using GrowIt.Application.Common.Interfaces;
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
            .FirstOrDefaultAsync(p => p.Id == request.PlanId && p.UserId == request.UserId, cancellationToken)
            ?? throw new KeyNotFoundException($"Training plan {request.PlanId} not found");

        // Workouts are history and outlive the plan they came from - detach them
        // rather than letting the delete cascade take them down.
        var dayIds = plan.Days.Select(d => d.Id).ToList();
        var workouts = await dbContext.Workouts
            .Where(w => w.PlanDayId != null && dayIds.Contains(w.PlanDayId.Value))
            .ToListAsync(cancellationToken);

        foreach (var workout in workouts)
        {
            workout.PlanDayId = null;
        }

        dbContext.TrainingPlans.Remove(plan);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Losing the active plan would leave the today screen with nothing to suggest.
        if (plan.IsActive)
        {
            var fallback = await dbContext.TrainingPlans
                .Where(p => p.UserId == request.UserId)
                .OrderBy(p => p.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (fallback is not null)
            {
                fallback.IsActive = true;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
