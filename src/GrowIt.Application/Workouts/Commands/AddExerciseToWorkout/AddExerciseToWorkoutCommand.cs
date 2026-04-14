using MediatR;

namespace GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;

public record AddExerciseToWorkoutCommand(Guid WorkoutId, Guid ExerciseId) : IRequest<Guid>;
