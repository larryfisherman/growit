using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.CreatePlanDay;

public class CreatePlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<CreatePlanDayCommand, Guid>
{
    public async Task<Guid> Handle(CreatePlanDayCommand request, CancellationToken cancellationToken)
    {
        var planExists = await dbContext.TrainingPlans
            .AnyAsync(p => p.Id == request.PlanId && p.UserId == request.UserId, cancellationToken);

        if (!planExists)
        {
            throw new KeyNotFoundException($"Training plan {request.PlanId} not found");
        }

        // New days land at the end; dragging them around rewrites the order later.
        var lastOrderIndex = await dbContext.TrainingPlanDays
            .Where(d => d.PlanId == request.PlanId)
            .MaxAsync(d => (int?)d.OrderIndex, cancellationToken) ?? -1;

        var day = new TrainingPlanDay
        {
            Id = Guid.NewGuid(),
            PlanId = request.PlanId,
            Name = request.Name,
            Notes = request.Notes,
            OrderIndex = lastOrderIndex + 1,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.TrainingPlanDays.Add(day);
        await dbContext.SaveChangesAsync(cancellationToken);

        return day.Id;
    }
}
