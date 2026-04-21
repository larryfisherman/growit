using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Queries.GetTemplates;

public class GetTemplatesQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetTemplatesQuery, List<TemplateSummary>>
{
    public async Task<List<TemplateSummary>> Handle(GetTemplatesQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.WorkoutTemplates
            .Where(t => t.UserId == request.UserId)
            .OrderBy(t => t.Name)
            .Select(t => new TemplateSummary(t.Id, t.Name, t.TemplateExercises.Count))
            .ToListAsync(cancellationToken);
    }
}
