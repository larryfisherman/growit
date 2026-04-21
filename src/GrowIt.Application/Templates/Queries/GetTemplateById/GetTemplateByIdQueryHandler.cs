using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Templates.Queries.GetTemplateById;

public class GetTemplateByIdQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetTemplateByIdQuery, TemplateDetailResponse?>
{
    public async Task<TemplateDetailResponse?> Handle(GetTemplateByIdQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.WorkoutTemplates
            .Where(t => t.Id == request.TemplateId)
            .Select(t => new TemplateDetailResponse(
                t.Id,
                t.Name,
                t.Notes,
                t.TemplateExercises
                    .OrderBy(te => te.OrderIndex)
                    .Select(te => new TemplateExerciseDetail(
                        te.Id,
                        te.ExerciseId,
                        te.Exercise != null ? te.Exercise.Name : te.CustomExerciseName!,
                        te.Exercise != null ? te.Exercise.Category : null,
                        te.TargetSets,
                        te.TargetReps,
                        te.RestSeconds,
                        te.OrderIndex))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
