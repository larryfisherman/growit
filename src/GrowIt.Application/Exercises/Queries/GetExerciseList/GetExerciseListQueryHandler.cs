using GrowIt.Application.Common.Interfaces;
using GrowIt.Contracts.Exercises.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Exercises.Queries.GetExerciseList;

public class GetExerciseListQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetExerciseListQuery, List<ExerciseResponse>>
{
    public async Task<List<ExerciseResponse>> Handle(GetExerciseListQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Exercises
            .Select(e => new ExerciseResponse(e.Id, e.Name, e.Category, e.MuscleGroup))
            .ToListAsync(cancellationToken);
    }
}
