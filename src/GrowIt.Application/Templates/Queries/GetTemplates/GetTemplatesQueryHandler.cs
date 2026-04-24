using GrowIt.Application.Common.Interfaces;
using GrowIt.Contracts.Templates.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Queries.GetTemplates;

public class GetTemplatesQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetTemplatesQuery, List<TemplateSummaryResponse>>
{
    public async Task<List<TemplateSummaryResponse>> Handle(GetTemplatesQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.WorkoutTemplates
            .Where(t => t.UserId == request.UserId)
            .OrderBy(t => t.Name)
            .Select(t => new TemplateSummaryResponse(t.Id, t.Name, t.TemplateExercises.Count))
            .ToListAsync(cancellationToken);
    }
}
