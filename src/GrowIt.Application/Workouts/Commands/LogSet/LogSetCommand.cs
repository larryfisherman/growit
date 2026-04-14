using MediatR;

namespace GrowIt.Application.Workouts.Commands.LogSet;

public record LogSetCommand(Guid WorkoutExerciseId, decimal WeightKg, int Reps) : IRequest<Guid>;