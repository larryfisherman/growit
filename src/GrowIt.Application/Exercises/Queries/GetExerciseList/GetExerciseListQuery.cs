using GrowIt.Contracts.Exercises.Responses;
using MediatR;

namespace GrowIt.Application.Exercises.Queries.GetExerciseList;

public record GetExerciseListQuery() : IRequest<List<ExerciseResponse>>;
