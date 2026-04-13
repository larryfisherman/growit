namespace GrowIt.Application.Exercises.Queries.GetExerciseList;

public record ExerciseListResponse(IReadOnlyList<ExerciseListDto> Items, int TotalCount);

public record ExerciseListDto(Guid Id, string Name, string Category, string MuscleGroup);