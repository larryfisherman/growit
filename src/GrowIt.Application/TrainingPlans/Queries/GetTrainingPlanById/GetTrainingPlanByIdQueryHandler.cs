using GrowIt.Application.Common.Interfaces;
using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Queries.GetTrainingPlanById;

public class GetTrainingPlanByIdQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetTrainingPlanByIdQuery, TrainingPlanResponse?>
{
    public async Task<TrainingPlanResponse?> Handle(
        GetTrainingPlanByIdQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.TrainingPlans
            .Where(p => p.Id == request.PlanId && p.UserId == request.UserId)
            .Select(p => new TrainingPlanResponse(
                p.Id,
                p.Name,
                p.Notes,
                p.IsActive,
                p.Days
                    .OrderBy(d => d.OrderIndex)
                    .Select(d => new PlanDaySummaryResponse(d.Id, d.Name, d.OrderIndex, d.Exercises.Count))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
