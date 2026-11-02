using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDay;

public class UpdatePlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<UpdatePlanDayCommand>
{
    public async Task Handle(UpdatePlanDayCommand request, CancellationToken cancellationToken)
    {
        var day = await dbContext.TrainingPlanDays
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(d => d.Id == request.PlanDayId, cancellationToken)
            ?? throw new NotFoundException($"Plan day {request.PlanDayId} not found");

        day.Name = request.Name;
        day.Notes = request.Notes;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
