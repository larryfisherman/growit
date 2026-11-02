using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Application.TrainingPlans.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.DeletePlanDay;

public class DeletePlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<DeletePlanDayCommand>
{
    public async Task Handle(DeletePlanDayCommand request, CancellationToken cancellationToken)
    {
        var day = await dbContext.TrainingPlanDays
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(d => d.Id == request.PlanDayId, cancellationToken);

        // Already gone is the requested state; see DeleteTrainingPlanCommandHandler.
        if (day is null) return;

        await PlanDayWorkouts.DetachAsync(dbContext, [day.Id], cancellationToken);

        dbContext.TrainingPlanDays.Remove(day);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
