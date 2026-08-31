using GrowIt.Application.Common.Interfaces;
using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Queries.GetTrainingPlans;

public class GetTrainingPlansQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetTrainingPlansQuery, List<TrainingPlanSummaryResponse>>
{
    public async Task<List<TrainingPlanSummaryResponse>> Handle(
        GetTrainingPlansQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.TrainingPlans
            .Where(p => p.UserId == request.UserId)
            .OrderByDescending(p => p.IsActive)
            .ThenBy(p => p.CreatedAt)
            .Select(p => new TrainingPlanSummaryResponse(p.Id, p.Name, p.IsActive, p.Days.Count))
            .ToListAsync(cancellationToken);
    }
}
