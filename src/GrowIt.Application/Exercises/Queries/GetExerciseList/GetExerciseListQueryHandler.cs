using MediatR;
using GrowIt.Application.Common.Interfaces;


namespace GrowIt.Application.Exercises.Queries.GetExerciseList;

public class GetExerciseListQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetExerciseListQuery, ExerciseListResponse>
{
    
}