using MediatR;
using GrowIt.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace GrowIt.Application.Exercises.Queries.GetExerciseList;

public class GetExerciseListQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetExerciseListQuery, List<ExerciseDto>>
{
    public async Task<List<ExerciseDto>> Handle(GetExerciseListQuery request, CancellationToken cancellationToken)
    {
        var query = dbContext.Exercises;

        return await query.Select(e => 
            new ExerciseDto(e.Id, e.Name, e.Category, e.MuscleGroup)).ToListAsync(cancellationToken);
    }
}