using MediatR;

namespace GrowIt.Application.Workouts.Commands.DeleteWorkout;

public record DeleteWorkoutCommand(Guid UserId, Guid WorkoutId) : IRequest;
