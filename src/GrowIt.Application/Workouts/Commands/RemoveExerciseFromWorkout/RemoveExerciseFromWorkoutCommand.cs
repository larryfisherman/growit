using MediatR;

namespace GrowIt.Application.Workouts.Commands.RemoveExerciseFromWorkout;

public record RemoveExerciseFromWorkoutCommand(Guid UserId, Guid WorkoutExerciseId) : IRequest;
