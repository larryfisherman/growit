using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDay;

public class UpdatePlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdatePlanDayCommand>
{
    public async Task Handle(UpdatePlanDayCommand request, CancellationToken cancellationToken)
    {
        var day = await dbContext.TrainingPlanDays
            .FirstOrDefaultAsync(
                d => d.Id == request.PlanDayId && d.Plan.UserId == request.UserId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Plan day {request.PlanDayId} not found");

        day.Name = request.Name;
        day.Notes = request.Notes;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
