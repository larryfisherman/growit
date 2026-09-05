using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.DeletePlanDay;

public class DeletePlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<DeletePlanDayCommand>
{
    public async Task Handle(DeletePlanDayCommand request, CancellationToken cancellationToken)
    {
        var day = await dbContext.TrainingPlanDays
            .FirstOrDefaultAsync(
                d => d.Id == request.PlanDayId && d.Plan.UserId == request.UserId,
                cancellationToken);

        // Already gone is the requested state; see DeleteTrainingPlanCommandHandler.
        if (day is null) return;

        // Sessions already performed from this day stay in history, just unlinked.
        var workouts = await dbContext.Workouts
            .Where(w => w.PlanDayId == day.Id)
            .ToListAsync(cancellationToken);

        foreach (var workout in workouts)
        {
            workout.PlanDayId = null;
        }

        dbContext.TrainingPlanDays.Remove(day);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
